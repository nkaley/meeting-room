import { IsDateString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpsertBookingDto {
  @IsUUID()
  roomId!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsString()
  @MinLength(1)
  description!: string;
}

export class ListBookingsDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  officeId?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;
}
