import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PeriodsService } from './periods.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import type { User } from '../users/user.entity';

@UseGuards(JwtGuard)
@Controller('periods')
export class PeriodsController {
  constructor(private readonly service: PeriodsService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user);
  }

  @Post()
  create(@Body() dto: CreatePeriodDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Post(':id/clone-templates')
  cloneFromTemplates(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.cloneFromTemplates(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePeriodDto>,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user);
  }
}
