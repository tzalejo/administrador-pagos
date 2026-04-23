import { Body, Controller, Delete, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../common/guards/jwt.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentEntriesService } from './payment-entries.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import type { User } from '../users/user.entity';

@UseGuards(JwtGuard)
@Controller()
export class PaymentEntriesController {
  constructor(private readonly service: PaymentEntriesService) {}

  @Post('periods/:periodId/entries')
  create(
    @Param('periodId', ParseIntPipe) periodId: number,
    @Body() dto: CreateEntryDto,
  ) {
    return this.service.create(periodId, dto);
  }

  @Patch('entries/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateEntryDto>,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete('entries/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
