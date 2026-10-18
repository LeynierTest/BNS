import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsDateOnly } from '../../common/validators/is-date-only.decorator';

export class CreatePhaseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsDateOnly()
  start_date: string;

  @IsDateOnly()
  end_date: string;
}
