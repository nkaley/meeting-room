import { IsString, MinLength } from 'class-validator';

export class UpsertOfficeDto {
  @IsString({ message: 'Название обязательно' })
  @MinLength(2, { message: 'Название должно содержать минимум 2 символа' })
  name!: string;

  @IsString({ message: 'Город обязателен' })
  @MinLength(1, { message: 'Город обязателен' })
  city!: string;

  @IsString({ message: 'Адрес обязателен' })
  @MinLength(1, { message: 'Адрес обязателен' })
  address!: string;
}
