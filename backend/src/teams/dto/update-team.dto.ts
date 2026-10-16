import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  province?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  championships_participated?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  championships_won?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  mascot?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  color?: string;
}
