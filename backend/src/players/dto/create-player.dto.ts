import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

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
  @IsNotEmpty()
  @MaxLength(50)
  position: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  at_bats: number | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  innings_pitched: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  hits: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  runs_allowed: number | null;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  batting_average: number;
}