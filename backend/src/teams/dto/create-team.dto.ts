import {
  IsInt,
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
}
