import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateSeasonTeamsDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  team_ids: number[];
}
