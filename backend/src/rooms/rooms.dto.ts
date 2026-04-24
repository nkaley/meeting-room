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
  @IsString()
  @MinLength(1)
  name!: string;

  @IsUUID()
  officeId!: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  isBookable!: boolean;
}
