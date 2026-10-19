import {
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  province: string;

  @IsInt()
  @Min(0)
  championships_participated: number;

  @IsInt()
  @Min(0)
  championships_won: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  mascot: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  color: string;

  /**
   * Temporada en la que se inscribe (por defecto, la más reciente); debe no
   * haber empezado.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  season_id?: number;
}
