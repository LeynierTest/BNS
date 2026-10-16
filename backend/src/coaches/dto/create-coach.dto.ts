import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCoachDto {
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

  @IsInt()
  @Min(0)
  years_experience: number;
}
