import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntry } from './payment-entry.entity';
import { PaymentEntriesController } from './payment-entries.controller';
import { PaymentEntriesService } from './payment-entries.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntry])],
  controllers: [PaymentEntriesController],
  providers: [PaymentEntriesService],
  exports: [PaymentEntriesService],
})
export class PaymentEntriesModule {}
