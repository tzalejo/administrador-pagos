import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntry } from './payment-entry.entity';
import { CategoriesService } from '../categories/categories.service';
import type { CreateEntryDto } from './dto/create-entry.dto';
import type { User } from '../users/user.entity';

@Injectable()
export class PaymentEntriesService {
  constructor(
    @InjectRepository(PaymentEntry)
    private readonly repo: Repository<PaymentEntry>,
    private readonly categoriesService: CategoriesService,
  ) {}

  findByPeriod(periodId: number): Promise<PaymentEntry[]> {
    return this.repo.find({
      where: { period: { id: periodId } },
      order: { sortOrder: 'ASC' },
    });
  }

  async create(periodId: number, dto: CreateEntryDto): Promise<PaymentEntry> {
    const { categoryId, serviceTemplateId, ...rest } = dto;
    const category = categoryId ? await this.categoriesService.findOne(categoryId) : null;
    const entry = this.repo.create({
      ...rest,
      category,
      serviceTemplate: { id: serviceTemplateId } as any,
      period: { id: periodId } as any,
    });
    return this.repo.save(entry);
  }

  async update(id: number, dto: Partial<CreateEntryDto>, _user: User): Promise<PaymentEntry> {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada no encontrada');

    const { categoryId, ...rest } = dto;
    Object.assign(entry, rest);

    if (categoryId !== undefined) {
      entry.category = categoryId ? await this.categoriesService.findOne(categoryId) : null;
    }

    return this.repo.save(entry);
  }

  async remove(id: number): Promise<void> {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    await this.repo.remove(entry);
  }
}
