import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
} from 'class-validator';

export enum ReportType {
  STANDINGS = 'standings',
  MATCHES_BY_TEAMS = 'matches-by-teams',
  MATCHES_BY_DATE = 'matches-by-date',
  TOP_COACHES = 'top-coaches',
  STADIUM_ATTENDANCE = 'stadium-attendance',
  TEAM_STATUS = 'team-status',
  ALL_STAR_TEAM = 'all-star-team',
}

export class SendReportEmailDto {
  @IsEmail()
  recipient!: string;

  @IsEnum(ReportType)
  report!: ReportType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  homeTeamId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  awayTeamId?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  stadiumId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teamId?: number;
}
