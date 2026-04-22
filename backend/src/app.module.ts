import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServiceTemplatesModule } from './service-templates/service-templates.module';
import { PeriodsModule } from './periods/periods.module';
import { PaymentEntriesModule } from './payment-entries/payment-entries.module';
import { ReportsModule } from './reports/reports.module';
import { User } from './users/user.entity';
import { ServiceTemplate } from './service-templates/service-template.entity';
import { PaymentPeriod } from './periods/payment-period.entity';
import { PaymentEntry } from './payment-entries/payment-entry.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      username: process.env.DB_USER ?? 'pagos_user',
      password: process.env.DB_PASS ?? 'pagos_pass',
      database: process.env.DB_NAME ?? 'pagos_db',
      entities: [User, ServiceTemplate, PaymentPeriod, PaymentEntry],
      synchronize: true,
      autoLoadEntities: true,
    }),
    AuthModule,
    UsersModule,
    ServiceTemplatesModule,
    PeriodsModule,
    PaymentEntriesModule,
    ReportsModule,
  ],
})
export class AppModule {}
