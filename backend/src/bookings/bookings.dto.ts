import { IsDateString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpsertBookingDto {
  @IsUUID('all', { message: 'Выберите переговорку' })
  roomId!: string;

  @IsDateString({}, { message: 'Некорректное время начала' })
  startAt!: string;

  @IsDateString({}, { message: 'Некорректное время окончания' })
  endAt!: string;

  @IsString({ message: 'Описание обязательно' })
  @MinLength(1, { message: 'Описание обязательно' })
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
