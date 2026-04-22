import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentPeriod } from '../periods/payment-period.entity';

@Entity('payment_entries')
export class PaymentEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PaymentPeriod, (period) => period.entries, { onDelete: 'CASCADE' })
  period: PaymentPeriod;

  @Column({ nullable: true })
  serviceTemplateId: string;

  @Column()
  serviceName: string;

  @Column({ nullable: true })
  category: string;

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
