import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSeasonDto {
  /** Nombre de la temporada dentro de su Serie, p. ej. "Temporada 2027". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  /** Serie existente; si se omite, se usa (o crea) la de `series_name`. */
  @IsOptional()
  @IsInt()
  @Min(1)
  series_id?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  series_name?: string;

  /** Equipos inscritos; si se omite, todos los registrados. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  team_ids?: number[];
}
