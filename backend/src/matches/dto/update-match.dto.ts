import {
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { IsDateOnly } from '../../common/validators/is-date-only.decorator';

export class UpdateMatchDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  away_team_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  home_team_id?: number;

  @IsOptional()
  @IsDateOnly()
  match_date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  stadium_id?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  phase_id?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  away_score?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  home_score?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  attendance?: number;
}
