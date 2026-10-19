import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
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

  /** Temporada de la fase; por defecto, la más reciente. */
  @IsOptional()
  @IsInt()
  @Min(1)
  season_id?: number;
}
