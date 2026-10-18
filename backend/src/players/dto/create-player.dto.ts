import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsBaseballInnings } from '../innings-pitched';
import { PLAYER_POSITIONS } from '../player-positions';

export class CreatePlayerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsInt()
  @Min(1)
  number: number;

  @IsInt()
  @Min(0)
  years_on_team: number;

  @IsInt()
  @Min(1)
  team_id: number;

  @IsString()
  @IsIn(PLAYER_POSITIONS, {
    message: `position debe ser una de: ${PLAYER_POSITIONS.join(', ')}`,
  })
  @MaxLength(50)
  position: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  at_bats: number | null;

  @IsOptional()
  @IsNumber()
  @Max(9999.2)
  @IsBaseballInnings()
  innings_pitched: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  hits: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  runs_allowed: number | null;

  // Sin batting_average: lo calcula la base (hits / at_bats; el promedio
  // del lanzador es su ERA). Enviarlo responde 400 (forbidNonWhitelisted).

  // Estadísticas solo de lanzador (WHIP, K/9, BB/9 y FIP).
  @IsOptional()
  @IsInt()
  @Min(0)
  hits_allowed?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  walks_allowed?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  strikeouts?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  home_runs_allowed?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  hit_batsmen?: number | null;
}
