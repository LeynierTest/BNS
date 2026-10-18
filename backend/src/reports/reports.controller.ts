import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { ParseDateOnlyPipe } from '../common/pipes/parse-date-only.pipe';
import { ReportsService } from './reports.service';

@Controller('reports/pdf')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private pdf(
    response: Response,
    fileName: string,
    content: Buffer,
  ): StreamableFile {
    response.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });

    return new StreamableFile(content);
  }

  @Get('standings')
  async standings(
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const content = await this.reportsService.standingsPdf();

    return this.pdf(response, 'tabla-posiciones.pdf', content);
  }

  @Get('matches-by-teams/:homeTeamId/:awayTeamId')
  async matchesByTeams(
    @Param('homeTeamId', ParseIntPipe) homeTeamId: number,
    @Param('awayTeamId', ParseIntPipe) awayTeamId: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const content = await this.reportsService.matchesByTeamsPdf(
      homeTeamId,
      awayTeamId,
    );

    return this.pdf(response, 'partidos-entre-equipos.pdf', content);
  }

  @Get('matches-by-date/:date')
  async matchesByDate(
    @Param('date', new ParseDateOnlyPipe()) date: string,
    @Query('stadiumId', new ParseIntPipe({ optional: true }))
    stadiumId?: number,
    @Res({ passthrough: true }) response?: Response,
  ): Promise<StreamableFile> {
    const content = await this.reportsService.matchesByDatePdf(
      date,
      stadiumId,
    );

    return this.pdf(
      response as Response,
      'partidos-por-fecha.pdf',
      content,
    );
  }

  @Get('top-coaches')
  async topCoaches(
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const content = await this.reportsService.topCoachesPdf();

    return this.pdf(response, 'entrenadores-destacados.pdf', content);
  }

  @Get('stadium-attendance')
  async stadiumAttendance(
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const content = await this.reportsService.stadiumAttendancePdf();

    return this.pdf(response, 'asistencia-estadios.pdf', content);
  }

  @Get('team-status/:teamId')
  async teamStatus(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const content = await this.reportsService.teamStatusPdf(teamId);

    return this.pdf(response, 'estado-equipo.pdf', content);
  }

  @Get('all-star-team')
  async allStarTeam(
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const content = await this.reportsService.allStarTeamPdf();

    return this.pdf(response, 'equipo-todos-estrellas.pdf', content);
  }
}
