import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntry } from './payment-entry.entity';
import { PaymentEntriesController } from './payment-entries.controller';
import { PaymentEntriesService } from './payment-entries.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentEntry]), CategoriesModule],
  controllers: [PaymentEntriesController],
  providers: [PaymentEntriesService],
  exports: [PaymentEntriesService],
})
export class PaymentEntriesModule {}
