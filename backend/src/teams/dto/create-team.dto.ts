import {
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  province: string;

  @IsInt()
  @Min(0)
  championships_participated: number;

  @IsInt()
  @Min(0)
  championships_won: number;

  @IsString()
  @IsNotEmpty()
  mascot: string;

  @IsString()
  @IsNotEmpty()
  color: string;
}
