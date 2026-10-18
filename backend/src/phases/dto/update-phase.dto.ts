import {
  IsIn,
  IsOptional,
} from 'class-validator';
import { IsDateOnly } from '../../common/validators/is-date-only.decorator';
import { PHASE_NAMES } from '../series-phases';

export class UpdatePhaseDto {
  @IsOptional()
  @IsIn(PHASE_NAMES, {
    message: `name debe ser una de: ${PHASE_NAMES.join(', ')}`,
  })
  name?: string;

  @IsOptional()
  @IsDateOnly()
  start_date?: string;

  @IsOptional()
  @IsDateOnly()
  end_date?: string;
}
