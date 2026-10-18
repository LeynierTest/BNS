import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { StandingsService } from '../standings/standings.service';
import { MatchesByTeamsService } from '../matches-by-teams/matches-by-teams.service';
import { MatchesByDateService } from '../matches-by-date/matches-by-date.service';
import { TopCoachesService } from '../top-coaches/top-coaches.service';
import { StadiumAttendanceService } from '../stadium-attendance/stadium-attendance.service';
import { TeamStatusService } from '../team-status/team-status.service';
import { AllStarTeamService } from '../all-star-team/all-star-team.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly standingsService: StandingsService,
    private readonly matchesByTeamsService: MatchesByTeamsService,
    private readonly matchesByDateService: MatchesByDateService,
    private readonly topCoachesService: TopCoachesService,
    private readonly stadiumAttendanceService: StadiumAttendanceService,
    private readonly teamStatusService: TeamStatusService,
    private readonly allStarTeamService: AllStarTeamService,
  ) {}

  private formatDate(date: Date | string): string {
    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return String(date);
    }

    // Las fechas de partido son columnas DATE (medianoche UTC) o cadenas
    // YYYY-MM-DD, que JavaScript también interpreta como UTC. Formatear en
    // la zona local del servidor (p. ej. America/Havana, UTC-4) mostraría
    // el día anterior.
    return value.toLocaleDateString('es-ES', { timeZone: 'UTC' });
  }

  private formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }

    return new Intl.NumberFormat('es-ES').format(value);
  }

  private formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }

    return `${value.toFixed(2)} %`;
  }

  private createDocument(title: string): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 45,
      info: {
        Title: title,
        Author: 'BNSM',
        Subject: 'Reporte de la Serie Nacional de Béisbol',
      },
    });

    doc.fontSize(18).font('Helvetica-Bold').text(title, {
      align: 'center',
    });

    doc.moveDown(0.5);

    doc
      .fontSize(9)
      .font('Helvetica')
      .text(`Generado: ${new Date().toLocaleString('es-ES')}`, {
        align: 'center',
      });

    doc.moveDown(1);

    return doc;
  }

  private addTable(
    doc: PDFKit.PDFDocument,
    headers: string[],
    rows: string[][],
    widths?: number[],
  ): void {
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const columnWidths =
      widths ??
      headers.map(() => pageWidth / Math.max(headers.length, 1));

    const rowHeight = 22;

    const drawHeader = () => {
      let x = doc.page.margins.left;
      const y = doc.y;

      doc.font('Helvetica-Bold').fontSize(8);

      headers.forEach((header, index) => {
        doc
          .rect(x, y, columnWidths[index], rowHeight)
          .stroke();

        doc.text(header, x + 4, y + 6, {
          width: columnWidths[index] - 8,
          height: rowHeight - 8,
          align: 'center',
        });

        x += columnWidths[index];
      });

      doc.y = y + rowHeight;
    };

    const drawRow = (row: string[]) => {
      let x = doc.page.margins.left;
      const y = doc.y;

      doc.font('Helvetica').fontSize(7.5);

      row.forEach((value, index) => {
        doc
          .rect(x, y, columnWidths[index], rowHeight)
          .stroke();

        doc.text(value, x + 4, y + 6, {
          width: columnWidths[index] - 8,
          height: rowHeight - 8,
          align: 'center',
          ellipsis: true,
        });

        x += columnWidths[index];
      });

      doc.y = y + rowHeight;
    };

    drawHeader();

    for (const row of rows) {
      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        drawHeader();
      }

      drawRow(row);
    }
  }

  private finish(doc: PDFKit.PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.end();
    });
  }

  async standingsPdf(): Promise<Buffer> {
    const data = await this.standingsService.getStandings();
    const doc = this.createDocument('Tabla de Posiciones');

    this.addTable(
      doc,
      ['Equipo', 'Juegos', 'Puntos'],
      data.map((item) => [
        item.team_name,
        this.formatNumber(item.games_played),
        this.formatNumber(item.points),
      ]),
      [300, 100, 100],
    );

    return this.finish(doc);
  }

  async matchesByTeamsPdf(
    homeTeamId: number,
    awayTeamId: number,
  ): Promise<Buffer> {
    const data = await this.matchesByTeamsService.getMatchesByTeams(
      homeTeamId,
      awayTeamId,
    );

    const doc = this.createDocument('Partidos entre Equipos');

    this.addTable(
      doc,
      ['Fecha', 'Visitante', 'Local', 'Estadio', 'Fase', 'Marcador', 'Asistencia'],
      data.map((item) => [
        this.formatDate(item.match_date),
        item.away_team,
        item.home_team,
        item.stadium,
        item.phase,
        `${item.away_score} - ${item.home_score}`,
        this.formatNumber(item.attendance),
      ]),
      [62, 75, 75, 80, 65, 58, 70],
    );

    return this.finish(doc);
  }

  async matchesByDatePdf(
    date: string,
    stadiumId?: number,
  ): Promise<Buffer> {
    const data = await this.matchesByDateService.getMatchesByDate(
      date,
      stadiumId,
    );

    const doc = this.createDocument(`Partidos del ${this.formatDate(date)}`);

    this.addTable(
      doc,
      ['Fecha', 'Visitante', 'Local', 'Estadio', 'Fase', 'Marcador', 'Asistencia'],
      data.map((item) => [
        this.formatDate(item.match_date),
        item.away_team,
        item.home_team,
        item.stadium,
        item.phase,
        `${item.away_score} - ${item.home_score}`,
        this.formatNumber(item.attendance),
      ]),
      [62, 75, 75, 80, 65, 58, 70],
    );

    return this.finish(doc);
  }

  async topCoachesPdf(): Promise<Buffer> {
    const data = await this.topCoachesService.getTopCoaches();
    const doc = this.createDocument('Entrenadores Destacados');

    this.addTable(
      doc,
      ['Equipo', 'Entrenador', 'Número', 'Experiencia'],
      data.map((item) => [
        item.team_name,
        item.coach_name,
        String(item.jersey_number),
        `${item.years_experience} años`,
      ]),
      [150, 220, 80, 100],
    );

    return this.finish(doc);
  }

  async stadiumAttendancePdf(): Promise<Buffer> {
    const data = await this.stadiumAttendanceService.getStadiumAttendance();
    const doc = this.createDocument('Asistencia por Estadio');

    this.addTable(
      doc,
      ['Estadio', 'Capacidad', 'Juegos', 'Asistencia', '% Ocupación'],
      data.map((item) => [
        item.stadium_name,
        this.formatNumber(item.capacity),
        this.formatNumber(item.games_played),
        this.formatNumber(item.total_attendance),
        this.formatPercentage(item.attendance_percentage),
      ]),
      [175, 95, 75, 105, 100],
    );

    return this.finish(doc);
  }

  async teamStatusPdf(teamId: number): Promise<Buffer> {
    const data = await this.teamStatusService.getTeamStatus(teamId);
    const doc = this.createDocument('Estado del Equipo por Fase');

    this.addTable(
      doc,
      [
        'Fase',
        'Ganados',
        'Perdidos',
        'Ganados Visitante',
        'Perdidos Visitante',
        'Ganados Local',
        'Perdidos Local',
      ],
      data.map((item) => [
        item.phase_name,
        String(item.games_won_total),
        String(item.games_lost_total),
        String(item.games_won_away),
        String(item.games_lost_away),
        String(item.games_won_home),
        String(item.games_lost_home),
      ]),
      [85, 65, 65, 85, 85, 75, 75],
    );

    return this.finish(doc);
  }

  async allStarTeamPdf(): Promise<Buffer> {
    const data = await this.allStarTeamService.getAllStarTeam();
    const doc = this.createDocument('Equipo Todos Estrellas');

    this.addTable(
      doc,
      ['Posición', 'Jugador', 'Equipo', 'Promedio de Bateo'],
      data.map((item) => [
        item.player_position,
        item.player_name,
        item.team_name,
        item.batting_average.toFixed(3),
      ]),
      [110, 200, 150, 100],
    );

    return this.finish(doc);
  }
}
