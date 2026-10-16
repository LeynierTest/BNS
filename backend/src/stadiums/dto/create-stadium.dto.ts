import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateStadiumDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  province: string;
}
