import { IsString, MinLength } from 'class-validator';

export class UpsertOfficeDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsString()
  @MinLength(1)
  address!: string;
}
