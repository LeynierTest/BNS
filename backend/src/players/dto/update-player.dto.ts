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
import { PLAYER_POSITIONS } from '../player-positions';

export class UpdatePlayerDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  number?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  years_on_team?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  team_id?: number;

  @IsOptional()
  @IsString()
  @IsIn(PLAYER_POSITIONS, {
    message: `position debe ser una de: ${PLAYER_POSITIONS.join(', ')}`,
  })
  @MaxLength(50)
  position?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  at_bats?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999.99)
  innings_pitched?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  hits?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  runs_allowed?: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(1)
  batting_average?: number;
}
