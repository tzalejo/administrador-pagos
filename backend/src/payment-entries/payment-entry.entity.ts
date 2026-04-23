import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentPeriod } from '../periods/payment-period.entity';
import { Category } from '../categories/category.entity';
import { ServiceTemplate } from '../service-templates/service-template.entity';

@Entity('payment_entries')
export class PaymentEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PaymentPeriod, (period) => period.entries, { onDelete: 'CASCADE' })
  period: PaymentPeriod;

  @ManyToOne(() => ServiceTemplate, { nullable: false, eager: true, onDelete: 'RESTRICT' })
  serviceTemplate: ServiceTemplate;

  @ManyToOne(() => Category, { nullable: true, eager: true, onDelete: 'SET NULL' })
  category: Category | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  amountArs: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amountUsd: number | null;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true, type: 'date' })
  dueDate: string | null;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
