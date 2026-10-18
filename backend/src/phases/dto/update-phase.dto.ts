import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsDateOnly } from '../../common/validators/is-date-only.decorator';

export class UpdatePhaseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsDateOnly()
  start_date?: string;

  @IsOptional()
  @IsDateOnly()
  end_date?: string;
}
