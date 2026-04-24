import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../common/guards/jwt.guard';
import { ServiceTemplatesService } from './service-templates.service';
import { CreateServiceTemplateDto } from './dto/create-service-template.dto';

@UseGuards(JwtGuard)
@Controller('service-templates')
export class ServiceTemplatesController {
  constructor(private readonly service: ServiceTemplatesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateServiceTemplateDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateServiceTemplateDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
