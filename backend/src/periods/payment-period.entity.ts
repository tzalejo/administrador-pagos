import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { PaymentEntry } from '../payment-entries/payment-entry.entity';

@Entity('payment_periods')
export class PaymentPeriod {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'date' })
  periodDate: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @OneToMany(() => PaymentEntry, (entry) => entry.period, { cascade: true })
  entries: PaymentEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date | null;
}
