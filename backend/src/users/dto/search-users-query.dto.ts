import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SearchUsersQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;

  // Solo 'true'/'false' se convierten; cualquier otro texto llega tal cual
  // a @IsBoolean y se rechaza, en vez de interpretarse como false.
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'active debe ser true o false' })
  active?: boolean;
}
