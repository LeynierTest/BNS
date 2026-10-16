import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import { ReportsService } from '../reports/reports.service';
import {
  ReportType,
  SendReportEmailDto,
} from './dto/send-report-email.dto';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly reportsService: ReportsService) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;

    if (!host || !port) {
      throw new Error(
        'SMTP no configurado. Define SMTP_HOST y SMTP_PORT en .env.',
      );
    }

    if (!user || !password) {
      throw new Error(
        'SMTP no configurado. Define SMTP_USER y SMTP_PASSWORD en .env.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass: password,
      },
    });
  }

  async sendReportEmail(dto: SendReportEmailDto) {
    const report = await this.generateReport(dto);

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    if (!from) {
      throw new InternalServerErrorException(
        'No se ha configurado SMTP_FROM.',
      );
    }

    try {
      await this.transporter.sendMail({
        from,
        to: dto.recipient,
        subject: `Reporte BNSM: ${report.title}`,
        text: [
          'Hola,',
          '',
          'Se adjunta el reporte solicitado de la Serie Nacional de Béisbol.',
          '',
          `Reporte: ${report.title}`,
          '',
          'Sistema BNSM',
        ].join('\n'),
        attachments: [
          {
            filename: report.filename,
            content: report.content,
            contentType: 'application/pdf',
          },
        ],
      });

      return {
        message: 'Reporte enviado correctamente por correo.',
        recipient: dto.recipient,
        report: report.title,
        filename: report.filename,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido al enviar correo';
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error enviando correo: ${message}`, stack);

      throw new InternalServerErrorException(
        'No se pudo enviar el reporte por correo. Intente nuevamente más tarde.',
      );
    }
  }

  private async generateReport(dto: SendReportEmailDto): Promise<{
    content: Buffer;
    title: string;
    filename: string;
  }> {
    switch (dto.report) {
      case ReportType.STANDINGS:
        return {
          content: await this.reportsService.standingsPdf(),
          title: 'Tabla de Posiciones',
          filename: 'tabla-posiciones.pdf',
        };

      case ReportType.MATCHES_BY_TEAMS:
        if (dto.homeTeamId === undefined || dto.awayTeamId === undefined) {
          throw new BadRequestException(
            'homeTeamId y awayTeamId son obligatorios para este reporte.',
          );
        }

        return {
          content: await this.reportsService.matchesByTeamsPdf(
            dto.homeTeamId,
            dto.awayTeamId,
          ),
          title: 'Partidos entre Equipos',
          filename: 'partidos-entre-equipos.pdf',
        };

      case ReportType.MATCHES_BY_DATE:
        if (!dto.date) {
          throw new BadRequestException(
            'date es obligatorio para este reporte.',
          );
        }

        return {
          content: await this.reportsService.matchesByDatePdf(
            dto.date,
            dto.stadiumId,
          ),
          title: `Partidos del ${dto.date}`,
          filename: 'partidos-por-fecha.pdf',
        };

      case ReportType.TOP_COACHES:
        return {
          content: await this.reportsService.topCoachesPdf(),
          title: 'Entrenadores Destacados',
          filename: 'entrenadores-destacados.pdf',
        };

      case ReportType.STADIUM_ATTENDANCE:
        return {
          content: await this.reportsService.stadiumAttendancePdf(),
          title: 'Asistencia por Estadio',
          filename: 'asistencia-estadios.pdf',
        };

      case ReportType.TEAM_STATUS:
        if (dto.teamId === undefined) {
          throw new BadRequestException(
            'teamId es obligatorio para este reporte.',
          );
        }

        return {
          content: await this.reportsService.teamStatusPdf(dto.teamId),
          title: 'Estado del Equipo por Fase',
          filename: 'estado-equipo.pdf',
        };

      case ReportType.ALL_STAR_TEAM:
        return {
          content: await this.reportsService.allStarTeamPdf(),
          title: 'Equipo Todos Estrellas',
          filename: 'equipo-todos-estrellas.pdf',
        };

      default:
        throw new BadRequestException('Tipo de reporte no válido.');
    }
  }
}
