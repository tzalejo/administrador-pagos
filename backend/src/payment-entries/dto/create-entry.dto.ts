import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

const STATUSES = ['paid', 'pending', 'no_charge', 'partial'] as const;

export class CreateEntryDto {
  @IsNumber()
  serviceTemplateId: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number | null;

  @IsOptional()
  @IsNumber()
  amountArs?: number | null;

  @IsOptional()
  @IsNumber()
  amountUsd?: number | null;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
