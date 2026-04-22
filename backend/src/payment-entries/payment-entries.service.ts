import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntry } from './payment-entry.entity';
import type { CreateEntryDto } from './dto/create-entry.dto';
import type { User } from '../users/user.entity';

@Injectable()
export class PaymentEntriesService {
  constructor(
    @InjectRepository(PaymentEntry)
    private readonly repo: Repository<PaymentEntry>,
  ) {}

  findByPeriod(periodId: string): Promise<PaymentEntry[]> {
    return this.repo.find({
      where: { period: { id: periodId } },
      order: { sortOrder: 'ASC', serviceName: 'ASC' },
    });
  }

  async create(periodId: string, dto: CreateEntryDto): Promise<PaymentEntry> {
    const entry = this.repo.create({ ...dto, period: { id: periodId } as any });
    return this.repo.save(entry);
  }

  async update(id: string, dto: Partial<CreateEntryDto>, _user: User): Promise<PaymentEntry> {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    Object.assign(entry, dto);
    return this.repo.save(entry);
  }

  async remove(id: string): Promise<void> {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    await this.repo.remove(entry);
  }

  async bulkUpdate(periodId: string, entries: Partial<CreateEntryDto>[]): Promise<PaymentEntry[]> {
    const results: PaymentEntry[] = [];
    for (const dto of entries) {
      const entry = this.repo.create({ ...dto, period: { id: periodId } as any });
      results.push(await this.repo.save(entry));
    }
    return results;
  }
}
