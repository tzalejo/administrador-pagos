import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceTemplate } from './service-template.entity';
import type { CreateServiceTemplateDto } from './dto/create-service-template.dto';

const DEFAULT_TEMPLATES = [
  { name: 'BPN masterC', category: 'credit_card', sortOrder: 1 },
  { name: 'seguro', category: 'insurance', sortOrder: 2 },
  { name: 'naranja', category: 'credit_card', sortOrder: 3 },
  { name: 'francés', category: 'credit_card', sortOrder: 4 },
  { name: 'celu', category: 'utilities', sortOrder: 5 },
  { name: 'celu-noelia', category: 'utilities', sortOrder: 6 },
  { name: 'internet', category: 'utilities', sortOrder: 7 },
  { name: 'gas', category: 'utilities', sortOrder: 8 },
  { name: 'afip', category: 'taxes', sortOrder: 9 },
  { name: 'binance', category: 'investment', sortOrder: 10 },
  { name: 'mama', category: 'personal', sortOrder: 11 },
  { name: 'MAI', category: 'other', sortOrder: 12 },
  { name: 'ATE', category: 'other', sortOrder: 13 },
  { name: 'Alquiler', category: 'rent', sortOrder: 14 },
  { name: 'ingles (china)', category: 'personal', sortOrder: 15 },
  { name: 'terapia Caball', category: 'personal', sortOrder: 16 },
  { name: 'contadora', category: 'personal', sortOrder: 17 },
  { name: 'terapias', category: 'personal', sortOrder: 18 },
];

@Injectable()
export class ServiceTemplatesService implements OnModuleInit {
  constructor(
    @InjectRepository(ServiceTemplate)
    private readonly repo: Repository<ServiceTemplate>,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count === 0) {
      await this.repo.save(DEFAULT_TEMPLATES);
    }
  }

  findAll(): Promise<ServiceTemplate[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  findActive(): Promise<ServiceTemplate[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async create(dto: CreateServiceTemplateDto): Promise<ServiceTemplate> {
    const template = this.repo.create(dto);
    return this.repo.save(template);
  }

  async update(id: string, dto: Partial<CreateServiceTemplateDto>): Promise<ServiceTemplate> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Servicio no encontrado');
    Object.assign(template, dto);
    return this.repo.save(template);
  }

  async remove(id: string): Promise<void> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Servicio no encontrado');
    await this.repo.remove(template);
  }
}
