import {
  IsDateString,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePhaseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;
}
