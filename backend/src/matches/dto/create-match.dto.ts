import {
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { IsDateOnly } from '../../common/validators/is-date-only.decorator';

export class CreateMatchDto {
  @IsInt()
  @Min(1)
  away_team_id: number;

  @IsInt()
  @Min(1)
  home_team_id: number;

  @IsDateOnly()
  match_date: string;

  @IsInt()
  @Min(1)
  stadium_id: number;

  @IsInt()
  @Min(1)
  phase_id: number;

  @IsInt()
  @Min(0)
  away_score: number;

  @IsInt()
  @Min(0)
  home_score: number;

  @IsInt()
  @Min(0)
  attendance: number;

  /** Partido de una serie de desempate del corte (regla 8/4/2). */
  @IsOptional()
  @IsBoolean()
  tiebreaker?: boolean;
}
