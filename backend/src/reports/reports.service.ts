import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntry } from '../payment-entries/payment-entry.entity';
import { PaymentPeriod } from '../periods/payment-period.entity';
import type { User } from '../users/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(PaymentEntry)
    private readonly entryRepo: Repository<PaymentEntry>,
    @InjectRepository(PaymentPeriod)
    private readonly periodRepo: Repository<PaymentPeriod>,
  ) {}

  async getYearlySummary(user: User, year: number) {
    const periods = await this.periodRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.entries', 'e')
      .where('p.user = :userId', { userId: user.id })
      .andWhere('EXTRACT(YEAR FROM p."periodDate"::date) = :year', { year })
      .orderBy('p.periodDate', 'ASC')
      .getMany();

    return periods.map((p) => {
      const totalArs = p.entries
        .filter((e) => e.status !== 'no_charge')
        .reduce((sum, e) => sum + Number(e.amountArs ?? 0), 0);

      const totalUsd = p.entries
        .filter((e) => e.status !== 'no_charge')
        .reduce((sum, e) => sum + Number(e.amountUsd ?? 0), 0);

      const pendingCount = p.entries.filter((e) => e.status === 'pending').length;
      const paidCount = p.entries.filter((e) => e.status === 'paid').length;

      return {
        periodId: p.id,
        periodDate: p.periodDate,
        label: p.label,
        totalArs,
        totalUsd,
        pendingCount,
        paidCount,
        entryCount: p.entries.length,
      };
    });
  }

  async getServiceHistory(user: User, serviceName: string) {
    const entries = await this.entryRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.period', 'p')
      .where('p.user = :userId', { userId: user.id })
      .andWhere('LOWER(e.serviceName) = LOWER(:name)', { name: serviceName })
      .orderBy('p.periodDate', 'ASC')
      .getMany();

    return entries.map((e) => ({
      periodId: e.period.id,
      periodDate: e.period.periodDate,
      label: e.period.label,
      amountArs: e.amountArs,
      amountUsd: e.amountUsd,
      status: e.status,
      paymentMethod: e.paymentMethod,
      notes: e.notes,
    }));
  }

  async getCategoryTotals(user: User, year: number) {
    const periods = await this.periodRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.entries', 'e')
      .leftJoinAndSelect('e.category', 'c')
      .where('p.user = :userId', { userId: user.id })
      .andWhere('EXTRACT(YEAR FROM p."periodDate"::date) = :year', { year })
      .getMany();

    const totals: Record<string, number> = {};

    for (const period of periods) {
      for (const entry of period.entries) {
        if (entry.status === 'no_charge' || !entry.category) continue;
        const key = entry.category.name;
        totals[key] = (totals[key] ?? 0) + Number(entry.amountArs ?? 0);
      }
    }

    return Object.entries(totals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }
}
