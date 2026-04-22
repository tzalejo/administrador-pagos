import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentPeriod } from './payment-period.entity';
import { PeriodsController } from './periods.controller';
import { PeriodsService } from './periods.service';
import { ServiceTemplatesModule } from '../service-templates/service-templates.module';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentPeriod]), ServiceTemplatesModule],
  controllers: [PeriodsController],
  providers: [PeriodsService],
  exports: [PeriodsService],
})
export class PeriodsModule {}
