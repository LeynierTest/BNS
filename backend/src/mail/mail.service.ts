import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import {
  FixedWindowLimiter,
  tooManyRequests,
} from '../common/rate-limit/fixed-window-limiter';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import {
  ReportType,
  SendReportEmailDto,
} from './dto/send-report-email.dto';

/** Correos de reportes que puede pedir cada usuario cada 10 minutos. */
const EMAILS_PER_USER = 5;
const EMAIL_WINDOW_MS = 10 * 60_000;

export type ReportEmailRequester = {
  userId: number;
  role: string;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  // Evita usar el SMTP del sistema para enviar correos en masa.
  private readonly emailsByUser = new FixedWindowLimiter(
    EMAILS_PER_USER,
    EMAIL_WINDOW_MS,
  );

  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
  ) {
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

  /**
   * Un usuario solo puede enviarse reportes a sí mismo; un Administrator,
   * a cualquier dirección. Sin destinatario, va al correo de quien lo pide.
   */
  private async resolveRecipient(
    recipient: string | undefined,
    requester: ReportEmailRequester,
  ): Promise<string> {
    const user = await this.prisma.app_user.findUnique({
      where: {
        user_id: requester.userId,
      },
      select: {
        email: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'El usuario no existe o está desactivado',
      );
    }

    if (
      recipient !== undefined &&
      recipient.toLowerCase() !== user.email.toLowerCase() &&
      requester.role !== 'Administrator'
    ) {
      throw new ForbiddenException(
        `Solo puedes enviar reportes a tu propio correo (${user.email})`,
      );
    }

    return recipient ?? user.email;
  }

  async sendReportEmail(
    dto: SendReportEmailDto,
    requester: ReportEmailRequester,
  ) {
    const recipient = await this.resolveRecipient(
      dto.recipient,
      requester,
    );
    const limitKey = String(requester.userId);
    const blockedFor = this.emailsByUser.blockedFor(limitKey);

    if (blockedFor > 0) {
      throw tooManyRequests(
        'Has pedido demasiados reportes por correo',
        blockedFor,
      );
    }

    this.emailsByUser.hit(limitKey);

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
        to: recipient,
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
        recipient,
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
          content: await this.reportsService.standingsPdf(dto.seasonId),
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
            dto.seasonId,
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
            dto.seasonId,
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
          content: await this.reportsService.stadiumAttendancePdf(
            dto.seasonId,
          ),
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
          content: await this.reportsService.teamStatusPdf(
            dto.teamId,
            dto.seasonId,
          ),
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
