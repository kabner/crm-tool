import { Permissions } from './permissions';

const ALL_PERMISSIONS = Object.values(Permissions);

export const DefaultRoles = {
  SUPER_ADMIN: {
    name: 'Super Admin',
    description: 'Full access to everything',
    permissions: ALL_PERMISSIONS,
    recordAccessLevel: 'everything',
  },
  ADMIN: {
    name: 'Admin',
    description: 'Full access except billing',
    permissions: ALL_PERMISSIONS.filter((p) => p !== Permissions.BILLING_MANAGE),
    recordAccessLevel: 'everything',
  },
  SALES_MANAGER: {
    name: 'Sales Manager',
    description: 'Full sales access + team data',
    permissions: [
      Permissions.CONTACTS_READ,
      Permissions.CONTACTS_WRITE,
      Permissions.CONTACTS_DELETE,
      Permissions.CONTACTS_EXPORT,
      Permissions.CONTACTS_IMPORT,
      Permissions.COMPANIES_READ,
      Permissions.COMPANIES_WRITE,
      Permissions.DEALS_READ,
      Permissions.DEALS_WRITE,
      Permissions.DEALS_DELETE,
      Permissions.PIPELINES_CONFIGURE,
      Permissions.REPORTS_READ,
      Permissions.REPORTS_CREATE,
      Permissions.DASHBOARDS_READ,
    ],
    recordAccessLevel: 'team',
  },
  SALES_REP: {
    name: 'Sales Rep',
    description: 'Own contacts and deals',
    permissions: [
      Permissions.CONTACTS_READ,
      Permissions.CONTACTS_WRITE,
      Permissions.COMPANIES_READ,
      Permissions.COMPANIES_WRITE,
      Permissions.DEALS_READ,
      Permissions.DEALS_WRITE,
      Permissions.REPORTS_READ,
      Permissions.DASHBOARDS_READ,
    ],
    recordAccessLevel: 'own',
  },
  VIEWER: {
    name: 'Viewer',
    description: 'Read-only access',
    permissions: [
      Permissions.CONTACTS_READ,
      Permissions.COMPANIES_READ,
      Permissions.DEALS_READ,
      Permissions.TICKETS_READ,
      Permissions.REPORTS_READ,
      Permissions.DASHBOARDS_READ,
      Permissions.KB_READ,
    ],
    recordAccessLevel: 'everything',
  },
} as const;
