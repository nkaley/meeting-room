import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class UpsertRoomDto {
  @IsString({ message: 'Название обязательно' })
  @MinLength(1, { message: 'Название обязательно' })
  name!: string;

  @IsUUID('all', { message: 'Выберите офис' })
  officeId!: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Вместимость должна быть положительным числом' })
  @Min(1, { message: 'Вместимость должна быть положительным числом' })
  capacity?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean({ message: 'Некорректное значение доступности' })
  isBookable!: boolean;
}
