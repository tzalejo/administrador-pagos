import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

const STATUSES = ['paid', 'pending', 'no_charge', 'partial'] as const;

export class CreateEntryDto {
  @IsString()
  @MinLength(1)
  serviceName: string;

  @IsOptional()
  @IsString()
  serviceTemplateId?: string;

  @IsOptional()
  @IsString()
  category?: string;

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
