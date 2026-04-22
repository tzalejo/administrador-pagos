import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreatePeriodDto {
  @IsDateString()
  periodDate: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
