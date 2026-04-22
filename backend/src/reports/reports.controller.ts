import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import type { User } from '../users/user.entity';

@UseGuards(JwtGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('yearly')
  yearlySummary(
    @CurrentUser() user: User,
    @Query('year') year: string,
  ) {
    return this.service.getYearlySummary(user, parseInt(year ?? String(new Date().getFullYear())));
  }

  @Get('service/:name')
  serviceHistory(
    @CurrentUser() user: User,
    @Param('name') name: string,
  ) {
    return this.service.getServiceHistory(user, name);
  }

  @Get('categories')
  categoryTotals(
    @CurrentUser() user: User,
    @Query('year') year: string,
  ) {
    return this.service.getCategoryTotals(user, parseInt(year ?? String(new Date().getFullYear())));
  }
}
