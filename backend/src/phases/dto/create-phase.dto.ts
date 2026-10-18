import { IsIn } from 'class-validator';
import { IsDateOnly } from '../../common/validators/is-date-only.decorator';
import { PHASE_NAMES } from '../series-phases';

export class CreatePhaseDto {
  @IsIn(PHASE_NAMES, {
    message: `name debe ser una de: ${PHASE_NAMES.join(', ')}`,
  })
  name: string;

  @IsDateOnly()
  start_date: string;

  @IsDateOnly()
  end_date: string;
}
