import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
const uuidv4 = randomUUID;

// Entity imports
import { Tenant } from '../../modules/crm/entities/tenant.entity';
import { User } from '../../modules/crm/entities/user.entity';
import { Role } from '../../modules/crm/entities/role.entity';
import { UserRole } from '../../modules/crm/entities/user-role.entity';
import { Session } from '../../modules/crm/entities/session.entity';
import { Contact } from '../../modules/crm/entities/contact.entity';
import { Company } from '../../modules/crm/entities/company.entity';
import { ContactCompany } from '../../modules/crm/entities/contact-company.entity';
import { Pipeline } from '../../modules/crm/entities/pipeline.entity';
import { DealStage } from '../../modules/crm/entities/deal-stage.entity';
import { Deal } from '../../modules/crm/entities/deal.entity';
import { Activity } from '../../modules/crm/entities/activity.entity';
import { CustomProperty } from '../../modules/crm/entities/custom-property.entity';
import { List } from '../../modules/crm/entities/list.entity';
import { ListMembership } from '../../modules/crm/entities/list-membership.entity';
import { SavedView } from '../../modules/crm/entities/saved-view.entity';

import { DefaultRoles } from '../../shared/auth/rbac/default-roles';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ---------------------------------------------------------------------------
// Static data pools
// ---------------------------------------------------------------------------

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Energy',
  'Real Estate',
  'Media',
  'Consulting',
  'Legal',
  'Transportation',
  'Agriculture',
  'Hospitality',
  'Telecommunications',
];

const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001-10000',
  '10000+',
];

const COMPANY_PREFIXES = [
  'Apex',
  'Nova',
  'Vertex',
  'Quantum',
  'Zenith',
  'Pinnacle',
  'Summit',
  'Nexus',
  'Horizon',
  'Catalyst',
  'Vanguard',
  'Stellar',
  'Eclipse',
  'Prism',
  'Orbit',
  'Fusion',
  'Atlas',
  'Beacon',
  'Crest',
  'Delta',
  'Ember',
  'Flux',
  'Genesis',
  'Helix',
  'Ion',
  'Jade',
  'Keystone',
  'Lumen',
  'Meridian',
  'Nimbus',
  'Onyx',
  'Pulse',
  'Radiant',
  'Sage',
  'Titan',
  'Unity',
  'Vector',
  'Wave',
  'Xcel',
  'Zephyr',
];

const COMPANY_SUFFIXES = [
  'Technologies',
  'Solutions',
  'Systems',
  'Group',
  'Labs',
  'Digital',
  'Dynamics',
  'Industries',
  'Analytics',
  'Innovations',
  'Networks',
  'Ventures',
  'Partners',
  'Corp',
  'Global',
  'Health',
  'Capital',
  'Logistics',
  'Media',
  'Software',
  'Consulting',
  'Robotics',
  'Bio',
  'Data',
  'AI',
];

const FIRST_NAMES = [
  'James',
  'Mary',
  'Robert',
  'Patricia',
  'John',
  'Jennifer',
  'Michael',
  'Linda',
  'David',
  'Elizabeth',
  'William',
  'Barbara',
  'Richard',
  'Susan',
  'Joseph',
  'Jessica',
  'Thomas',
  'Sarah',
  'Charles',
  'Karen',
  'Christopher',
  'Lisa',
  'Daniel',
  'Nancy',
  'Matthew',
  'Betty',
  'Anthony',
  'Margaret',
  'Mark',
  'Sandra',
  'Donald',
  'Ashley',
  'Steven',
  'Dorothy',
  'Paul',
  'Kimberly',
  'Andrew',
  'Emily',
  'Joshua',
  'Donna',
  'Kenneth',
  'Michelle',
  'Kevin',
  'Carol',
  'Brian',
  'Amanda',
  'George',
  'Melissa',
  'Timothy',
  'Deborah',
  'Ronald',
  'Stephanie',
  'Edward',
  'Rebecca',
  'Jason',
  'Sharon',
  'Jeffrey',
  'Laura',
  'Ryan',
  'Cynthia',
];

const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'Allen',
  'King',
  'Wright',
  'Scott',
  'Torres',
  'Nguyen',
  'Hill',
  'Flores',
  'Green',
  'Adams',
  'Nelson',
  'Baker',
  'Hall',
  'Rivera',
  'Campbell',
  'Mitchell',
  'Carter',
  'Roberts',
  'Gomez',
  'Phillips',
  'Evans',
  'Turner',
  'Diaz',
  'Parker',
  'Cruz',
  'Edwards',
  'Collins',
  'Reyes',
];

const JOB_TITLES = [
  'CEO',
  'CTO',
  'CFO',
  'VP of Sales',
  'VP of Marketing',
  'VP of Engineering',
  'Director of Operations',
  'Director of Sales',
  'Director of Marketing',
  'Director of Product',
  'Engineering Manager',
  'Product Manager',
  'Sales Manager',
  'Marketing Manager',
  'Account Executive',
  'Business Development Rep',
  'Software Engineer',
  'Senior Software Engineer',
  'Data Analyst',
  'Project Manager',
  'Operations Manager',
  'HR Manager',
  'Financial Analyst',
  'Consultant',
  'Designer',
];

const LIFECYCLE_STAGES = [
  'subscriber',
  'lead',
  'marketing_qualified',
  'sales_qualified',
  'opportunity',
  'customer',
  'evangelist',
];

const LEAD_STATUSES = [
  'new',
  'open',
  'in_progress',
  'open_deal',
  'unqualified',
  'attempted_to_contact',
  'connected',
  'bad_timing',
];

const TAGS = [
  'enterprise',
  'startup',
  'inbound',
  'outbound',
  'referral',
  'partner',
  'trade-show',
  'webinar',
  'content',
  'demo-requested',
];

const LEAD_SOURCES = [
  'Google Ads',
  'LinkedIn',
  'Referral',
  'Cold Outreach',
  'Trade Show',
  'Website',
  'Partner',
];

const CONTACT_METHODS = ['Email', 'Phone', 'LinkedIn'];

const DEAL_ADJECTIVES = [
  'Enterprise',
  'Professional',
  'Standard',
  'Custom',
  'Premium',
  'Growth',
  'Starter',
  'Advanced',
  'Strategic',
  'Platform',
];

const DEAL_NOUNS = [
  'License',
  'Implementation',
  'Migration',
  'Expansion',
  'Renewal',
  'Upgrade',
  'Deployment',
  'Integration',
  'Onboarding',
  'Partnership',
];

const ACTIVITY_SUBJECTS: Record<string, string[]> = {
  note: [
    'Discovery call notes',
    'Meeting follow-up',
    'Prospect research',
    'Competitive analysis',
    'Technical requirements',
    'Budget discussion notes',
    'Stakeholder mapping',
    'Action items from sync',
  ],
  task: [
    'Send proposal',
    'Schedule demo',
    'Follow up on pricing',
    'Prepare presentation',
    'Update CRM records',
    'Send case study',
    'Review contract',
    'Coordinate with legal',
    'Set up trial account',
    'Send thank-you email',
  ],
  call: [
    'Discovery call',
    'Product demo',
    'Pricing discussion',
    'Technical deep-dive',
    'Executive briefing',
    'Quarterly review',
    'Onboarding kickoff',
    'Support follow-up',
  ],
  email: [
    'Introduction email',
    'Proposal sent',
    'Follow-up email',
    'Meeting confirmation',
    'Thank you note',
    'Contract details',
    'Product updates',
    'Referral request',
  ],
  meeting: [
    'Initial discovery meeting',
    'Product demo meeting',
    'Proposal review',
    'Negotiation session',
    'Executive alignment',
    'Quarterly business review',
    'Onboarding kickoff',
    'Project retrospective',
  ],
};

const ACTIVITY_TYPES = ['note', 'task', 'call', 'email', 'meeting'];

const US_STATES = [
  'CA',
  'NY',
  'TX',
  'FL',
  'IL',
  'PA',
  'OH',
  'GA',
  'NC',
  'MI',
  'WA',
  'MA',
  'CO',
  'AZ',
  'VA',
];

const CITIES = [
  'San Francisco',
  'New York',
  'Austin',
  'Miami',
  'Chicago',
  'Philadelphia',
  'Columbus',
  'Atlanta',
  'Charlotte',
  'Detroit',
  'Seattle',
  'Boston',
  'Denver',
  'Phoenix',
  'Richmond',
];

const LOST_REASONS = [
  'Budget constraints',
  'Went with competitor',
  'No decision made',
  'Requirements changed',
  'Champion left company',
  'Timing not right',
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'crm',
    password: process.env.DATABASE_PASSWORD || 'localdev',
    database: process.env.DATABASE_NAME || 'crm_dev',
    entities: [
      Tenant,
      User,
      Role,
      UserRole,
      Session,
      Contact,
      Company,
      ContactCompany,
      Pipeline,
      DealStage,
      Deal,
      Activity,
      CustomProperty,
      List,
      ListMembership,
      SavedView,
    ],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Connected to database');

  const queryRunner = dataSource.createQueryRunner();

  try {
    // ------------------------------------------------------------------
    // Clean existing seed data (order matters due to FK constraints)
    // ------------------------------------------------------------------
    console.log('Clearing existing data...');
    await queryRunner.query('DELETE FROM list_memberships');
    await queryRunner.query('DELETE FROM lists');
    await queryRunner.query('DELETE FROM saved_views');
    await queryRunner.query('DELETE FROM activities');
    await queryRunner.query('DELETE FROM deals');
    await queryRunner.query('DELETE FROM deal_stages');
    await queryRunner.query('DELETE FROM pipelines');
    await queryRunner.query('DELETE FROM contact_companies');
    await queryRunner.query('DELETE FROM contacts');
    await queryRunner.query('DELETE FROM companies');
    await queryRunner.query('DELETE FROM custom_properties');
    await queryRunner.query('DELETE FROM sessions');
    await queryRunner.query('DELETE FROM user_roles');
    await queryRunner.query('DELETE FROM users');
    await queryRunner.query('DELETE FROM roles');
    await queryRunner.query('DELETE FROM tenants');
    console.log('Existing data cleared');

    // ------------------------------------------------------------------
    // 1. Tenant
    // ------------------------------------------------------------------
    console.log('Creating tenant...');
    const tenantId = uuidv4();
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(Tenant)
      .values({
        id: tenantId,
        name: 'Acme Corporation',
        domain: 'acme.com',
        plan: 'professional',
        settings: {},
        securitySettings: {},
      })
      .execute();
    console.log('  Tenant created: Acme Corporation');

    // ------------------------------------------------------------------
    // 2. Roles
    // ------------------------------------------------------------------
    console.log('Creating roles...');
    const roleMap: Record<string, string> = {};
    const roleEntries = Object.entries(DefaultRoles);
    for (const [key, roleDef] of roleEntries) {
      const roleId = uuidv4();
      roleMap[key] = roleId;
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(Role)
        .values({
          id: roleId,
          tenantId,
          name: roleDef.name,
          description: roleDef.description,
          isSystem: true,
          permissions: roleDef.permissions as any,
          recordAccessLevel: roleDef.recordAccessLevel,
        })
        .execute();
    }
    console.log(`  Created ${roleEntries.length} roles`);

    // ------------------------------------------------------------------
    // 3. Admin user
    // ------------------------------------------------------------------
    console.log('Creating users...');
    const passwordHash = await bcrypt.hash('Password123!', 12);
    const adminId = uuidv4();
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        id: adminId,
        tenantId,
        email: 'admin@acme.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        status: 'active',
        timezone: 'America/New_York',
      })
      .execute();

    await dataSource
      .createQueryBuilder()
      .insert()
      .into(UserRole)
      .values({
        userId: adminId,
        roleId: roleMap.SUPER_ADMIN,
      })
      .execute();

    // ------------------------------------------------------------------
    // 4. Sales rep users
    // ------------------------------------------------------------------
    const salesRepData = [
      {
        email: 'sarah.johnson@acme.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
      },
      { email: 'mike.chen@acme.com', firstName: 'Mike', lastName: 'Chen' },
      {
        email: 'emily.davis@acme.com',
        firstName: 'Emily',
        lastName: 'Davis',
      },
      {
        email: 'james.wilson@acme.com',
        firstName: 'James',
        lastName: 'Wilson',
      },
      { email: 'lisa.park@acme.com', firstName: 'Lisa', lastName: 'Park' },
    ];

    const userIds: string[] = [adminId];
    for (const rep of salesRepData) {
      const userId = uuidv4();
      userIds.push(userId);
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          id: userId,
          tenantId,
          email: rep.email,
          passwordHash,
          firstName: rep.firstName,
          lastName: rep.lastName,
          status: 'active',
          timezone: 'America/New_York',
        })
        .execute();

      await dataSource
        .createQueryBuilder()
        .insert()
        .into(UserRole)
        .values({
          userId,
          roleId: roleMap.SALES_REP,
        })
        .execute();
    }
    console.log(`  Created 6 users (1 admin + 5 sales reps)`);

    // ------------------------------------------------------------------
    // 5. Companies (500)
    // ------------------------------------------------------------------
    console.log('Creating 500 companies...');
    const companyIds: string[] = [];
    const companyDomains: string[] = [];
    const companyBatch: any[] = [];
    const usedCompanyNames = new Set<string>();

    for (let i = 0; i < 500; i++) {
      let companyName: string;
      do {
        companyName = `${randomItem(COMPANY_PREFIXES)} ${randomItem(COMPANY_SUFFIXES)}`;
      } while (usedCompanyNames.has(companyName));
      usedCompanyNames.add(companyName);

      const id = uuidv4();
      companyIds.push(id);
      const domain = `${slugify(companyName)}.com`;
      companyDomains.push(domain);
      const stateIdx = randomInt(0, US_STATES.length - 1);

      companyBatch.push({
        id,
        tenantId,
        name: companyName,
        domain,
        industry: randomItem(INDUSTRIES),
        size: randomItem(COMPANY_SIZES),
        phone: `+1${randomInt(200, 999)}${randomInt(200, 999)}${randomInt(1000, 9999)}`,
        address: {
          street: `${randomInt(100, 9999)} ${randomItem(['Main', 'Oak', 'Elm', 'Market', 'Pine', 'Cedar', 'Tech'])} ${randomItem(['St', 'Ave', 'Blvd', 'Dr', 'Way'])}`,
          city: CITIES[stateIdx],
          state: US_STATES[stateIdx],
          zip: `${randomInt(10000, 99999)}`,
          country: 'US',
        },
        ownerId: randomItem(userIds),
        customProps: {},
      });
    }

    // Bulk insert companies in batches of 250
    for (let i = 0; i < companyBatch.length; i += 250) {
      const chunk = companyBatch.slice(i, i + 250);
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(Company)
        .values(chunk)
        .execute();
    }
    console.log('  500 companies created');

    // ------------------------------------------------------------------
    // 6. Contacts (10,000) - batched
    // ------------------------------------------------------------------
    console.log('Creating 10,000 contacts...');
    const contactIds: string[] = [];
    const contactCompanyPairs: { contactId: string; companyIdx: number }[] = [];
    const BATCH_SIZE = 1000;
    const startTime = Date.now();

    for (let batch = 0; batch < 10; batch++) {
      const contactBatch: any[] = [];

      for (let i = 0; i < BATCH_SIZE; i++) {
        const id = uuidv4();
        contactIds.push(id);
        const firstName = randomItem(FIRST_NAMES);
        const lastName = randomItem(LAST_NAMES);
        const companyIdx = randomInt(0, companyIds.length - 1);

        // Build email from name + company domain
        const emailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
        const email = `${emailPrefix}${randomInt(1, 999)}@${companyDomains[companyIdx]}`;

        // Random tags (0-3 tags per contact)
        const numTags = randomInt(0, 3);
        const contactTags: string[] = [];
        for (let t = 0; t < numTags; t++) {
          const tag = randomItem(TAGS);
          if (!contactTags.includes(tag)) contactTags.push(tag);
        }

        // Custom props (roughly 60% have them)
        const customProps: Record<string, any> = {};
        if (Math.random() < 0.6) {
          customProps.leadSource = randomItem(LEAD_SOURCES);
          customProps.annualBudget = randomInt(10000, 5000000);
        }

        const lifecycleStage = randomItem(LIFECYCLE_STAGES);
        const leadStatus =
          lifecycleStage === 'customer' ? null : randomItem(LEAD_STATUSES);
        const lastActivityAt = randomDate(
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          new Date(),
        );

        contactBatch.push({
          id,
          tenantId,
          firstName,
          lastName,
          email,
          phone: `+1${randomInt(200, 999)}${randomInt(200, 999)}${randomInt(1000, 9999)}`,
          jobTitle: randomItem(JOB_TITLES),
          lifecycleStage,
          leadStatus,
          ownerId: randomItem(userIds),
          tags: contactTags,
          customProps,
          source: randomItem(LEAD_SOURCES),
          lastActivityAt,
        });

        contactCompanyPairs.push({ contactId: id, companyIdx });
      }

      await dataSource
        .createQueryBuilder()
        .insert()
        .into(Contact)
        .values(contactBatch)
        .execute();

      console.log(
        `  Contacts: ${(batch + 1) * BATCH_SIZE}/10,000 (${((Date.now() - startTime) / 1000).toFixed(1)}s)`,
      );
    }

    // ------------------------------------------------------------------
    // 7. ContactCompany associations (batched)
    // ------------------------------------------------------------------
    console.log('Creating contact-company associations...');
    for (let i = 0; i < contactCompanyPairs.length; i += BATCH_SIZE) {
      const chunk = contactCompanyPairs.slice(i, i + BATCH_SIZE);
      const ccBatch = chunk.map((pair) => ({
        contactId: pair.contactId,
        companyId: companyIds[pair.companyIdx],
        isPrimary: true,
        role: randomItem([
          'Employee',
          'Decision Maker',
          'Champion',
          'Influencer',
          'End User',
        ]),
      }));

      await dataSource
        .createQueryBuilder()
        .insert()
        .into(ContactCompany)
        .values(ccBatch)
        .execute();
    }
    console.log('  Contact-company associations created');

    // ------------------------------------------------------------------
    // 8. Pipeline & deal stages
    // ------------------------------------------------------------------
    console.log('Creating pipeline and stages...');
    const pipelineId = uuidv4();
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(Pipeline)
      .values({
        id: pipelineId,
        tenantId,
        name: 'Sales Pipeline',
        isDefault: true,
      })
      .execute();

    const stageDefinitions = [
      {
        name: 'Prospecting',
        position: 1,
        probability: 10,
        stageType: 'open',
      },
      {
        name: 'Qualification',
        position: 2,
        probability: 20,
        stageType: 'open',
      },
      { name: 'Proposal', position: 3, probability: 40, stageType: 'open' },
      {
        name: 'Negotiation',
        position: 4,
        probability: 60,
        stageType: 'open',
      },
      {
        name: 'Closed Won',
        position: 5,
        probability: 100,
        stageType: 'won',
      },
      {
        name: 'Closed Lost',
        position: 6,
        probability: 0,
        stageType: 'lost',
      },
    ];

    const stageIds: { id: string; stageType: string; name: string }[] = [];
    for (const stageDef of stageDefinitions) {
      const stageId = uuidv4();
      stageIds.push({
        id: stageId,
        stageType: stageDef.stageType,
        name: stageDef.name,
      });
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(DealStage)
        .values({
          id: stageId,
          pipelineId,
          ...stageDef,
        })
        .execute();
    }
    console.log('  Pipeline created with 6 stages');

    // ------------------------------------------------------------------
    // 9. Deals (200)
    // ------------------------------------------------------------------
    console.log('Creating 200 deals...');
    const dealIds: string[] = [];
    const dealBatch: any[] = [];
    const now = new Date();
    const sixMonthsAgo = new Date(
      now.getTime() - 180 * 24 * 60 * 60 * 1000,
    );
    const threeMonthsFuture = new Date(
      now.getTime() + 90 * 24 * 60 * 60 * 1000,
    );

    for (let i = 0; i < 200; i++) {
      const id = uuidv4();
      dealIds.push(id);
      const stage = randomItem(stageIds);
      const companyIdx = randomInt(0, companyIds.length - 1);
      const amount = randomInt(5, 500) * 1000;
      const closeDate = randomDate(sixMonthsAgo, threeMonthsFuture);

      const dealData: any = {
        id,
        tenantId,
        name: `${randomItem(DEAL_ADJECTIVES)} ${randomItem(DEAL_NOUNS)} - ${companyBatch[companyIdx].name}`,
        amount,
        stageId: stage.id,
        pipelineId,
        closeDate: closeDate.toISOString().split('T')[0],
        ownerId: randomItem(userIds),
        companyId: companyIds[companyIdx],
        customProps: {},
      };

      if (stage.stageType === 'won') {
        dealData.won = true;
      } else if (stage.stageType === 'lost') {
        dealData.won = false;
        dealData.lostReason = randomItem(LOST_REASONS);
      }

      dealBatch.push(dealData);
    }

    // Bulk insert deals
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(Deal)
      .values(dealBatch)
      .execute();
    console.log('  200 deals created');

    // ------------------------------------------------------------------
    // 10. Activities (2,000) - batched
    // ------------------------------------------------------------------
    console.log('Creating 2,000 activities...');
    const threeMonthsAgo = new Date(
      now.getTime() - 90 * 24 * 60 * 60 * 1000,
    );
    const oneMonthFuture = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    for (let batch = 0; batch < 4; batch++) {
      const activityBatch: any[] = [];

      for (let i = 0; i < 500; i++) {
        const type = randomItem(ACTIVITY_TYPES);
        const subject = randomItem(ACTIVITY_SUBJECTS[type] || ['General activity']);
        const createdAt = randomDate(threeMonthsAgo, now);
        const contactId = randomItem(contactIds);
        const userId = randomItem(userIds);

        const activityData: any = {
          tenantId,
          type,
          subject,
          body: `${subject} - Detailed notes about this ${type} activity with the contact. Key discussion points and follow-up items recorded.`,
          contactId,
          userId,
          metadata: {},
        };

        // Optionally associate with a deal
        if (Math.random() < 0.3 && dealIds.length > 0) {
          activityData.dealId = randomItem(dealIds);
        }

        // Tasks get due dates; some are completed
        if (type === 'task') {
          const isCompleted = Math.random() < 0.4;
          if (isCompleted) {
            activityData.dueDate = randomDate(threeMonthsAgo, now);
            activityData.completedAt = randomDate(
              activityData.dueDate,
              now,
            );
          } else {
            // Future due date for open tasks
            activityData.dueDate = randomDate(now, oneMonthFuture);
          }
        }

        // Meetings and calls can have metadata
        if (type === 'meeting' || type === 'call') {
          activityData.metadata = {
            duration: randomInt(15, 90),
            outcome: randomItem([
              'positive',
              'neutral',
              'needs_follow_up',
            ]),
          };
        }

        activityBatch.push(activityData);
      }

      await dataSource
        .createQueryBuilder()
        .insert()
        .into(Activity)
        .values(activityBatch)
        .execute();

      console.log(`  Activities: ${(batch + 1) * 500}/2,000`);
    }

    // ------------------------------------------------------------------
    // 11. Custom properties (3 for contacts)
    // ------------------------------------------------------------------
    console.log('Creating custom properties...');
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(CustomProperty)
      .values(([
        {
          tenantId,
          objectType: 'contact',
          name: 'lead_source',
          label: 'Lead Source',
          fieldType: 'dropdown',
          options: {
            choices: [
              'Google Ads',
              'LinkedIn',
              'Referral',
              'Cold Outreach',
              'Trade Show',
              'Website',
              'Partner',
            ],
          },
          group: 'Lead Information',
          required: false,
          position: 0,
        },
        {
          tenantId,
          objectType: 'contact',
          name: 'annual_budget',
          label: 'Annual Budget',
          fieldType: 'currency',
          options: { currency: 'USD' },
          group: 'Financial',
          required: false,
          position: 1,
        },
        {
          tenantId,
          objectType: 'contact',
          name: 'preferred_contact_method',
          label: 'Preferred Contact Method',
          fieldType: 'dropdown',
          options: { choices: ['Email', 'Phone', 'LinkedIn'] },
          group: 'Preferences',
          required: false,
          position: 2,
        },
      ]) as any)
      .execute();
    console.log('  3 custom properties created');

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n--- Seed Summary ---');
    console.log(`  Tenant:             1`);
    console.log(`  Roles:              ${roleEntries.length}`);
    console.log(`  Users:              6`);
    console.log(`  Companies:          500`);
    console.log(`  Contacts:           10,000`);
    console.log(`  Contact-Companies:  10,000`);
    console.log(`  Pipeline:           1 (6 stages)`);
    console.log(`  Deals:              200`);
    console.log(`  Activities:         2,000`);
    console.log(`  Custom Properties:  3`);
    console.log(`  Total time:         ${elapsed}s`);
    console.log('--------------------\n');
  } finally {
    await queryRunner.release();
    await dataSource.destroy();
  }

  console.log('Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
