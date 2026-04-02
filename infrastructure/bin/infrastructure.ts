#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { InfrastructureStack } from '../lib/infrastructure-stack';

const app = new cdk.App();

// Dev environment
new InfrastructureStack(app, 'CrmDevStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  envName: 'dev',
  vpcCidr: '10.1.0.0/16',
  maxAzs: 2,
  natGateways: 1,
  dbMinCapacity: 0.5,
  dbMaxCapacity: 2,
  dbReaderInstances: 0,
  dbBackupRetentionDays: 7,
  apiCpu: 512,
  apiMemory: 1024,
  apiDesiredCount: 1,
  apiMinCount: 1,
  apiMaxCount: 2,
  webCpu: 512,
  webMemory: 1024,
  webDesiredCount: 1,
  enableWaf: false,
  enableContainerInsights: false,
});

// Production environment
new InfrastructureStack(app, 'CrmProdStack', {
  env: {
    account: process.env.CDK_PROD_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  envName: 'prod',
  vpcCidr: '10.2.0.0/16',
  maxAzs: 3,
  natGateways: 3,
  dbMinCapacity: 2,
  dbMaxCapacity: 16,
  dbReaderInstances: 1,
  dbBackupRetentionDays: 30,
  apiCpu: 1024,
  apiMemory: 2048,
  apiDesiredCount: 2,
  apiMinCount: 2,
  apiMaxCount: 10,
  webCpu: 512,
  webMemory: 1024,
  webDesiredCount: 2,
  enableWaf: true,
  enableContainerInsights: true,
});
