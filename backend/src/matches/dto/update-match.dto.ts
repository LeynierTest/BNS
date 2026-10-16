import {
  IsDateString,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

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
  @IsDateString()
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
