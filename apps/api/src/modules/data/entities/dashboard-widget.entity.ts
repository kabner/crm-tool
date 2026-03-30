import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Dashboard } from './dashboard.entity';

@Entity('dashboard_widgets')
export class DashboardWidget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'dashboard_id' })
  dashboardId: string;

  @Column()
  title: string;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ name: 'report_id', type: 'uuid', nullable: true })
  reportId: string;

  @Column({ type: 'jsonb', default: '{}' })
  config: Record<string, any>;

  @Column({ type: 'jsonb' })
  position: Record<string, any>;

  @Column({ name: 'refresh_interval', type: 'integer', nullable: true })
  refreshInterval: number;

  @ManyToOne(() => Dashboard)
  @JoinColumn({ name: 'dashboard_id' })
  dashboard: Dashboard;
}
