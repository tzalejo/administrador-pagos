import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceTemplate } from './service-template.entity';
import { CategoriesService } from '../categories/categories.service';
import type { CreateServiceTemplateDto } from './dto/create-service-template.dto';

const DEFAULT_TEMPLATES = [
  { name: 'BPN masterC', categoryName: 'credit_card', sortOrder: 1 },
  { name: 'seguro', categoryName: 'insurance', sortOrder: 2 },
  { name: 'naranja', categoryName: 'credit_card', sortOrder: 3 },
  { name: 'francés', categoryName: 'credit_card', sortOrder: 4 },
  { name: 'celu', categoryName: 'utilities', sortOrder: 5 },
  { name: 'celu-noelia', categoryName: 'utilities', sortOrder: 6 },
  { name: 'internet', categoryName: 'utilities', sortOrder: 7 },
  { name: 'gas', categoryName: 'utilities', sortOrder: 8 },
  { name: 'afip', categoryName: 'taxes', sortOrder: 9 },
  { name: 'binance', categoryName: 'investment', sortOrder: 10 },
  { name: 'mama', categoryName: 'personal', sortOrder: 11 },
  { name: 'MAI', categoryName: 'other', sortOrder: 12 },
  { name: 'ATE', categoryName: 'other', sortOrder: 13 },
  { name: 'Alquiler', categoryName: 'rent', sortOrder: 14 },
  { name: 'ingles (china)', categoryName: 'personal', sortOrder: 15 },
  { name: 'terapia Caball', categoryName: 'personal', sortOrder: 16 },
  { name: 'contadora', categoryName: 'personal', sortOrder: 17 },
  { name: 'terapias', categoryName: 'personal', sortOrder: 18 },
];

@Injectable()
export class ServiceTemplatesService implements OnModuleInit {
  constructor(
    @InjectRepository(ServiceTemplate)
    private readonly repo: Repository<ServiceTemplate>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async onModuleInit() {
    const count = await this.repo.count();
    if (count > 0) return;

    const allCategories = await this.categoriesService.findAll();
    const catMap = new Map(allCategories.map((c) => [c.name, c]));

    for (const t of DEFAULT_TEMPLATES) {
      await this.repo.save({
        name: t.name,
        category: catMap.get(t.categoryName) ?? null,
        sortOrder: t.sortOrder,
      });
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
    const { categoryId, ...rest } = dto;
    const category = categoryId
      ? await this.categoriesService.findOne(categoryId)
      : null;
    return this.repo.save(this.repo.create({ ...rest, category }));
  }

  async update(id: number, dto: Partial<CreateServiceTemplateDto>): Promise<ServiceTemplate> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Servicio no encontrado');

    const { categoryId, ...rest } = dto;
    Object.assign(template, rest);

    if (categoryId !== undefined) {
      template.category = categoryId ? await this.categoriesService.findOne(categoryId) : null;
    }

    return this.repo.save(template);
  }

  async remove(id: number): Promise<void> {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Servicio no encontrado');
    await this.repo.remove(template);
  }
}
