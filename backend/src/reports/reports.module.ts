import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntry } from '../payment-entries/payment-entry.entity';
import { PaymentPeriod } from '../periods/payment-period.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntry, PaymentPeriod])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
