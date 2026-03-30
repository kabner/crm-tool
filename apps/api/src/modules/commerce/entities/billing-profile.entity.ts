import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('billing_profiles')
export class BillingProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id' })
  tenantId: string;

  @Column({ name: 'contact_id' })
  contactId: string;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string;

  @Column({ name: 'billing_email', type: 'varchar', nullable: true })
  billingEmail: string;

  @Column({ name: 'billing_address', type: 'jsonb', nullable: true })
  billingAddress: Record<string, any>;

  @Column({ name: 'tax_id', type: 'varchar', nullable: true })
  taxId: string;

  @Column({ name: 'default_payment_terms', type: 'varchar', nullable: true })
  defaultPaymentTerms: string;

  @Column({ name: 'default_currency', type: 'varchar', default: 'USD' })
  defaultCurrency: string;

  @Column({ name: 'payment_methods', type: 'jsonb', default: '[]' })
  paymentMethods: any[];
}
