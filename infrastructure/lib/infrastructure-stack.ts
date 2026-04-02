import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

export interface CrmStackProps extends cdk.StackProps {
  envName: string;
  vpcCidr: string;
  maxAzs: number;
  natGateways: number;
  dbMinCapacity: number;
  dbMaxCapacity: number;
  dbReaderInstances: number;
  dbBackupRetentionDays: number;
  apiCpu: number;
  apiMemory: number;
  apiDesiredCount: number;
  apiMinCount: number;
  apiMaxCount: number;
  webCpu: number;
  webMemory: number;
  webDesiredCount: number;
  enableWaf: boolean;
  enableContainerInsights: boolean;
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CrmStackProps) {
    super(scope, id, props);

    const {
      envName,
      vpcCidr,
      maxAzs,
      natGateways,
      dbMinCapacity,
      dbMaxCapacity,
      dbReaderInstances,
      dbBackupRetentionDays,
      apiCpu,
      apiMemory,
      apiDesiredCount,
      apiMinCount,
      apiMaxCount,
      webCpu,
      webMemory,
      webDesiredCount,
      enableWaf,
      enableContainerInsights,
    } = props;

    const isProd = envName === 'prod';
    const dbName = `crm_${envName}`;

    // ─── VPC ───────────────────────────────────────────────────────────
    const vpc = new ec2.Vpc(this, 'CrmVpc', {
      maxAzs,
      natGateways,
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
      subnetConfiguration: [
        { cidrMask: 24, name: 'Public', subnetType: ec2.SubnetType.PUBLIC },
        { cidrMask: 24, name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        { cidrMask: 24, name: 'Isolated', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
      flowLogs: {
        default: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
          trafficType: ec2.FlowLogTrafficType.REJECT,
        },
      },
    });

    // ─── Security Groups ───────────────────────────────────────────────
    const albSg = new ec2.SecurityGroup(this, 'AlbSg', {
      vpc,
      description: 'ALB security group',
      allowAllOutbound: false,
    });
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'HTTP');
    albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS');

    const fargateSg = new ec2.SecurityGroup(this, 'FargateSg', {
      vpc,
      description: 'Fargate tasks security group',
    });
    fargateSg.addIngressRule(albSg, ec2.Port.tcp(3001), 'API from ALB');
    fargateSg.addIngressRule(albSg, ec2.Port.tcp(3000), 'Web from ALB');

    const dbSg = new ec2.SecurityGroup(this, 'DbSg', {
      vpc,
      description: 'Aurora security group',
      allowAllOutbound: false,
    });
    dbSg.addIngressRule(fargateSg, ec2.Port.tcp(5432), 'PostgreSQL from Fargate');

    const redisSg = new ec2.SecurityGroup(this, 'RedisSg', {
      vpc,
      description: 'Redis security group',
      allowAllOutbound: false,
    });
    redisSg.addIngressRule(fargateSg, ec2.Port.tcp(6379), 'Redis from Fargate');

    albSg.addEgressRule(fargateSg, ec2.Port.tcp(3001), 'To API');
    albSg.addEgressRule(fargateSg, ec2.Port.tcp(3000), 'To Web');

    // ─── Secrets ───────────────────────────────────────────────────────
    const dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName: `crm/${envName}/db-credentials`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'crmadmin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    const jwtSecret = new secretsmanager.Secret(this, 'JwtSecret', {
      secretName: `crm/${envName}/jwt-secret`,
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 64,
      },
    });

    const jwtRefreshSecret = new secretsmanager.Secret(this, 'JwtRefreshSecret', {
      secretName: `crm/${envName}/jwt-refresh-secret`,
      generateSecretString: {
        excludePunctuation: true,
        passwordLength: 64,
      },
    });

    // ─── Aurora Serverless v2 (PostgreSQL 16) ──────────────────────────
    const dbCluster = new rds.DatabaseCluster(this, 'CrmDb', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_4,
      }),
      credentials: rds.Credentials.fromSecret(dbSecret),
      defaultDatabaseName: dbName,
      serverlessV2MinCapacity: dbMinCapacity,
      serverlessV2MaxCapacity: dbMaxCapacity,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      readers: dbReaderInstances > 0
        ? [rds.ClusterInstance.serverlessV2('reader', { scaleWithWriter: true })]
        : [],
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      storageEncrypted: true,
      backup: { retention: cdk.Duration.days(dbBackupRetentionDays) },
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      deletionProtection: isProd,
    });

    // ─── ElastiCache Redis Serverless ──────────────────────────────────
    new elasticache.CfnServerlessCache(this, 'CrmRedis', {
      serverlessCacheName: `crm-${envName}-redis`,
      engine: 'redis',
      securityGroupIds: [redisSg.securityGroupId],
      subnetIds: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }).subnetIds,
    });

    // ─── S3 Bucket (Assets) ────────────────────────────────────────────
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `crm-assets-${this.account}-${envName}`,
      encryption: isProd ? s3.BucketEncryption.KMS_MANAGED : s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      versioned: isProd,
    });

    // ─── ECR Repositories (created outside CDK, imported) ──────────────
    const apiRepo = ecr.Repository.fromRepositoryName(this, 'ApiRepo', 'crm/api');
    const webRepo = ecr.Repository.fromRepositoryName(this, 'WebRepo', 'crm/web');

    // ─── ECS Cluster ───────────────────────────────────────────────────
    const cluster = new ecs.Cluster(this, 'CrmCluster', {
      vpc,
      clusterName: `crm-${envName}`,
      containerInsightsV2: enableContainerInsights
        ? ecs.ContainerInsights.ENHANCED
        : ecs.ContainerInsights.DISABLED,
    });

    // ─── ALB ───────────────────────────────────────────────────────────
    const alb = new elbv2.ApplicationLoadBalancer(this, 'CrmAlb', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const listener = alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    // ─── WAF (production only by default) ──────────────────────────────
    if (enableWaf) {
      const wafAcl = new wafv2.CfnWebACL(this, 'CrmWaf', {
        defaultAction: { allow: {} },
        scope: 'REGIONAL',
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: `crm-${envName}-waf`,
          sampledRequestsEnabled: true,
        },
        rules: [
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 1,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: 'CommonRuleSet',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'AWSManagedRulesSQLiRuleSet',
            priority: 2,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: 'SQLiRuleSet',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
            priority: 3,
            overrideAction: { none: {} },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: 'KnownBadInputsRuleSet',
              sampledRequestsEnabled: true,
            },
          },
        ],
      });

      new wafv2.CfnWebACLAssociation(this, 'WafAlbAssociation', {
        resourceArn: alb.loadBalancerArn,
        webAclArn: wafAcl.attrArn,
      });
    }

    // ─── Shared environment variables ──────────────────────────────────
    const dbEndpoint = dbCluster.clusterEndpoint;
    const redisEndpoint = `crm-${envName}-redis.serverless.${this.region}.cache.amazonaws.com`;

    // ─── API Fargate Service ───────────────────────────────────────────
    const apiTaskDef = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      memoryLimitMiB: apiMemory,
      cpu: apiCpu,
    });

    dbSecret.grantRead(apiTaskDef.taskRole);
    jwtSecret.grantRead(apiTaskDef.taskRole);
    jwtRefreshSecret.grantRead(apiTaskDef.taskRole);
    assetsBucket.grantReadWrite(apiTaskDef.taskRole);

    apiTaskDef.addContainer('api', {
      image: ecs.ContainerImage.fromEcrRepository(apiRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'crm-api',
        logRetention: isProd ? logs.RetentionDays.THREE_MONTHS : logs.RetentionDays.ONE_MONTH,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3001',
        DB_HOST: dbEndpoint.hostname,
        DB_PORT: '5432',
        DB_NAME: dbName,
        REDIS_URL: `redis://${redisEndpoint}:6379`,
        AWS_S3_BUCKET: assetsBucket.bucketName,
        APP_URL: `http://${alb.loadBalancerDnsName}`,
      },
      secrets: {
        DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
        JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret),
        JWT_REFRESH_SECRET: ecs.Secret.fromSecretsManager(jwtRefreshSecret),
      },
      portMappings: [{ containerPort: 3001 }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3001/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    const apiService = new ecs.FargateService(this, 'ApiService', {
      cluster,
      taskDefinition: apiTaskDef,
      desiredCount: apiDesiredCount,
      serviceName: `crm-${envName}-api`,
      securityGroups: [fargateSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });

    // API auto-scaling
    const apiScaling = apiService.autoScaleTaskCount({
      minCapacity: apiMinCount,
      maxCapacity: apiMaxCount,
    });
    apiScaling.scaleOnCpuUtilization('ApiCpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    listener.addTargets('ApiTarget', {
      port: 3001,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [apiService],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*', '/health'])],
      priority: 10,
    });

    // ─── Web Fargate Service ───────────────────────────────────────────
    const webTaskDef = new ecs.FargateTaskDefinition(this, 'WebTaskDef', {
      memoryLimitMiB: webMemory,
      cpu: webCpu,
    });

    webTaskDef.addContainer('web', {
      image: ecs.ContainerImage.fromEcrRepository(webRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'crm-web',
        logRetention: isProd ? logs.RetentionDays.THREE_MONTHS : logs.RetentionDays.ONE_MONTH,
      }),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        NEXT_PUBLIC_API_URL: `http://${alb.loadBalancerDnsName}`,
      },
      portMappings: [{ containerPort: 3000 }],
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    const webService = new ecs.FargateService(this, 'WebService', {
      cluster,
      taskDefinition: webTaskDef,
      desiredCount: webDesiredCount,
      serviceName: `crm-${envName}-web`,
      securityGroups: [fargateSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
    });

    listener.addTargets('WebTarget', {
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [webService],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      conditions: [elbv2.ListenerCondition.pathPatterns(['/*'])],
      priority: 20,
    });

    // ─── Migration Task Definition ─────────────────────────────────────
    const migrateTaskDef = new ecs.FargateTaskDefinition(this, 'MigrateTaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
      family: `crm-${envName}-migrate`,
    });

    dbSecret.grantRead(migrateTaskDef.taskRole);

    migrateTaskDef.addContainer('migrate', {
      image: ecs.ContainerImage.fromEcrRepository(apiRepo, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'crm-migrate',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        DB_HOST: dbEndpoint.hostname,
        DB_PORT: '5432',
        DB_NAME: dbName,
      },
      secrets: {
        DB_USERNAME: ecs.Secret.fromSecretsManager(dbSecret, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
      },
      command: ['node', 'dist/database/run-migrations.js'],
    });

    // ─── CloudWatch Alarms ─────────────────────────────────────────────
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `crm-${envName}-alarms`,
    });

    // API 5xx error rate
    new cloudwatch.Alarm(this, 'Api5xxAlarm', {
      metric: alb.metrics.httpCodeTarget(elbv2.HttpCodeTarget.TARGET_5XX_COUNT, {
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 2,
      alarmName: `crm-${envName}-api-5xx`,
      alarmDescription: 'API 5xx error count exceeds threshold',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // API response latency (p99)
    new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      metric: alb.metrics.targetResponseTime({
        period: cdk.Duration.minutes(5),
        statistic: 'p99',
      }),
      threshold: 2,
      evaluationPeriods: 3,
      alarmName: `crm-${envName}-api-latency-p99`,
      alarmDescription: 'API p99 latency exceeds 2 seconds',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Aurora CPU utilization
    new cloudwatch.Alarm(this, 'AuroraCpuAlarm', {
      metric: dbCluster.metricCPUUtilization({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 80,
      evaluationPeriods: 3,
      alarmName: `crm-${envName}-aurora-cpu`,
      alarmDescription: 'Aurora CPU utilization exceeds 80%',
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Aurora database connections
    new cloudwatch.Alarm(this, 'AuroraConnectionsAlarm', {
      metric: dbCluster.metricDatabaseConnections({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmName: `crm-${envName}-aurora-connections`,
      alarmDescription: 'Aurora connection count is high',
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // Fargate API task count = 0 (critical)
    new cloudwatch.Alarm(this, 'ApiTaskCountAlarm', {
      metric: apiService.metricCpuUtilization({ period: cdk.Duration.minutes(1) }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_OR_EQUAL_TO_THRESHOLD,
      alarmName: `crm-${envName}-api-no-tasks`,
      alarmDescription: 'CRITICAL: No API tasks running',
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    }).addAlarmAction(new cloudwatch_actions.SnsAction(alarmTopic));

    // ─── Outputs ───────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'ALB DNS name — access the CRM at this URL',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `http://${alb.loadBalancerDnsName}/api/v1`,
      description: 'API base URL',
    });

    new cdk.CfnOutput(this, 'EcrApiRepo', {
      value: apiRepo.repositoryUri,
      description: 'ECR repository URI for API image',
    });

    new cdk.CfnOutput(this, 'EcrWebRepo', {
      value: webRepo.repositoryUri,
      description: 'ECR repository URI for Web image',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'ECS cluster name',
    });

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: dbEndpoint.hostname,
      description: 'Aurora PostgreSQL endpoint',
    });

    new cdk.CfnOutput(this, 'PrivateSubnets', {
      value: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds.join(','),
      description: 'Private subnet IDs for migration tasks',
    });

    new cdk.CfnOutput(this, 'MigrateTaskSG', {
      value: fargateSg.securityGroupId,
      description: 'Security group for migration tasks',
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS topic for CloudWatch alarms — subscribe your email/Slack here',
    });
  }
}
