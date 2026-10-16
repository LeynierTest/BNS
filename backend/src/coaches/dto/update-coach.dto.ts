import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateCoachDto {
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
  @IsInt()
  @Min(0)
  years_experience?: number;
}
