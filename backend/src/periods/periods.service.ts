import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentPeriod } from './payment-period.entity';
import { ServiceTemplatesService } from '../service-templates/service-templates.service';
import type { CreatePeriodDto } from './dto/create-period.dto';
import type { User } from '../users/user.entity';

@Injectable()
export class PeriodsService {
  constructor(
    @InjectRepository(PaymentPeriod)
    private readonly repo: Repository<PaymentPeriod>,
    private readonly templatesService: ServiceTemplatesService,
  ) {}

  findAll(user: User): Promise<PaymentPeriod[]> {
    return this.repo.find({
      where: { user: { id: user.id } },
      order: { periodDate: 'DESC' },
      relations: ['entries', 'entries.serviceTemplate'],
    });
  }

  async findOne(id: number, user: User): Promise<PaymentPeriod> {
    const period = await this.repo.findOne({
      where: { id, user: { id: user.id } },
      relations: ['entries', 'entries.category', 'entries.serviceTemplate'],
    });
    if (!period) throw new NotFoundException('Período no encontrado');
    return period;
  }

  async create(dto: CreatePeriodDto, user: User): Promise<PaymentPeriod> {
    const normalized = dto.periodDate.slice(0, 7) + '-01';
    const existing = await this.repo.findOne({
      where: { user: { id: user.id }, periodDate: normalized },
    });
    if (existing) throw new ConflictException('Ya existe un período para ese mes y año');
    const period = this.repo.create({ ...dto, periodDate: normalized, user });
    return this.repo.save(period);
  }

  async cloneFromTemplates(id: number, user: User): Promise<PaymentPeriod> {
    const period = await this.findOne(id, user);
    const templates = await this.templatesService.findActive();

    const entries = templates.map((t, i) => ({
      serviceTemplate: { id: t.id },
      category: t.category ?? null,
      status: 'pending',
      sortOrder: t.sortOrder ?? i,
      dueDate: period.periodDate,
    }));

    period.entries = entries as any;
    return this.repo.save(period);
  }

  async update(id: number, dto: Partial<CreatePeriodDto>, user: User): Promise<PaymentPeriod> {
    const period = await this.findOne(id, user);
    Object.assign(period, dto);
    return this.repo.save(period);
  }

  async remove(id: number, user: User): Promise<void> {
    const period = await this.findOne(id, user);
    await this.repo.remove(period);
  }
}
