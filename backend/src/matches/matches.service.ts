import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchesEventsService } from './matches-events.service';
import { QualificationService } from '../qualification/qualification.service';
import { UNSAVED_ID } from '../qualification/series-qualification';
import type { SeriesMatch } from '../qualification/series-qualification';

const matchInclude = {
  team_match_home_team_idToteam: true,
  team_match_away_team_idToteam: true,
  stadium: true,
  phase: true,
} satisfies Prisma.matchInclude;

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchesEventsService: MatchesEventsService,
    private readonly qualificationService: QualificationService,
  ) {}

  async searchMatches(
    awayTeam?: string,
    homeTeam?: string,
    matchDate?: string,
    stadium?: string,
    phase?: string,
  ) {
    return this.prisma.$queryRaw`
      SELECT *
      FROM search_matches(
        p_away_team => ${awayTeam ?? null},
        p_home_team => ${homeTeam ?? null},
        p_match_date => ${matchDate ?? null},
        p_stadium => ${stadium ?? null},
        p_phase => ${phase ?? null}
      )
    `;
  }

  async getAllMatches() {
    return this.prisma.match.findMany({
      orderBy: {
        match_date: 'asc',
      },
      include: matchInclude,
    });
  }

  async getMatchById(id: number) {
    const match = await this.prisma.match.findUnique({
      where: {
        match_id: id,
      },
      include: matchInclude,
    });

    if (!match) {
      throw new NotFoundException(
        `El partido con ID ${id} no existe`,
      );
    }

    return match;
  }

  private validateMatchDateInPhase(
    matchDate: Date,
    phase: {
      name: string;
      start_date: Date;
      end_date: Date;
    },
  ) {
    const matchDateOnly = matchDate.toISOString().slice(0, 10);
    const phaseStart = phase.start_date.toISOString().slice(0, 10);
    const phaseEnd = phase.end_date.toISOString().slice(0, 10);

    if (matchDateOnly < phaseStart || matchDateOnly > phaseEnd) {
      throw new BadRequestException(
        `La fecha del partido ${matchDateOnly} está fuera del período de la fase "${phase.name}" (${phaseStart} al ${phaseEnd})`,
      );
    }
  }

  private validateAttendance(
    attendance: number,
    stadium: {
      name: string;
      capacity: number;
    },
  ) {
    if (attendance > stadium.capacity) {
      throw new BadRequestException(
        `La audiencia (${attendance}) no puede superar la capacidad del estadio "${stadium.name}" (${stadium.capacity})`,
      );
    }
  }

  async createMatch(data: CreateMatchDto) {
    if (data.away_team_id === data.home_team_id) {
      throw new BadRequestException(
        'El equipo visitante y el equipo local deben ser diferentes',
      );
    }

    const [awayTeam, homeTeam, stadium, phase] =
      await Promise.all([
        this.prisma.team.findUnique({
          where: {
            team_id: data.away_team_id,
          },
        }),
        this.prisma.team.findUnique({
          where: {
            team_id: data.home_team_id,
          },
        }),
        this.prisma.stadium.findUnique({
          where: {
            stadium_id: data.stadium_id,
          },
        }),
        this.prisma.phase.findUnique({
          where: {
            phase_id: data.phase_id,
          },
        }),
      ]);

    if (!awayTeam) {
      throw new NotFoundException(
        `El equipo visitante con ID ${data.away_team_id} no existe`,
      );
    }

    if (!homeTeam) {
      throw new NotFoundException(
        `El equipo local con ID ${data.home_team_id} no existe`,
      );
    }

    if (!stadium) {
      throw new NotFoundException(
        `El estadio con ID ${data.stadium_id} no existe`,
      );
    }

    if (!phase) {
      throw new NotFoundException(
        `La fase con ID ${data.phase_id} no existe`,
      );
    }

    const matchDate = new Date(
      `${data.match_date}T00:00:00.000Z`,
    );

    this.validateMatchDateInPhase(matchDate, phase);
    this.validateAttendance(data.attendance, stadium);

    const tiebreaker = data.tiebreaker ?? false;
    const seriesMatch: SeriesMatch = {
      match_id: UNSAVED_ID,
      phase_id: data.phase_id,
      away_team_id: data.away_team_id,
      home_team_id: data.home_team_id,
      away_score: data.away_score,
      home_score: data.home_score,
      tiebreaker,
      match_date: data.match_date,
    };

    try {
      const createdMatch =
        await this.qualificationService.runConsistentWrite({
          focusMatchId: UNSAVED_ID,
          simulate: (snapshot) => ({
            ...snapshot,
            matches: [...snapshot.matches, seriesMatch],
          }),
          write: (tx) =>
            tx.match.create({
              data: {
                away_team_id: data.away_team_id,
                home_team_id: data.home_team_id,
                match_date: matchDate,
                stadium_id: data.stadium_id,
                phase_id: data.phase_id,
                away_score: data.away_score,
                home_score: data.home_score,
                attendance: data.attendance,
                tiebreaker,
              },
              include: matchInclude,
            }),
        });

      this.matchesEventsService.emit(
        'match.created',
        createdMatch,
      );

      return createdMatch;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Uno de los registros relacionados con el partido no es válido',
        );
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2039'
      ) {
        throw new BadRequestException(
          'El partido no cumple una regla de negocio de la base de datos',
        );
      }

      throw error;
    }
  }

  async updateMatch(
    id: number,
    data: UpdateMatchDto,
  ) {
    const currentMatch = await this.getMatchById(id);

    const awayTeamId =
      data.away_team_id !== undefined
        ? data.away_team_id
        : currentMatch.away_team_id;

    const homeTeamId =
      data.home_team_id !== undefined
        ? data.home_team_id
        : currentMatch.home_team_id;

    const stadiumId =
      data.stadium_id !== undefined
        ? data.stadium_id
        : currentMatch.stadium_id;

    const phaseId =
      data.phase_id !== undefined
        ? data.phase_id
        : currentMatch.phase_id;

    if (awayTeamId === homeTeamId) {
      throw new BadRequestException(
        'El equipo visitante y el equipo local deben ser diferentes',
      );
    }

    const [awayTeam, homeTeam, stadium, phase] =
      await Promise.all([
        this.prisma.team.findUnique({
          where: {
            team_id: awayTeamId,
          },
        }),
        this.prisma.team.findUnique({
          where: {
            team_id: homeTeamId,
          },
        }),
        this.prisma.stadium.findUnique({
          where: {
            stadium_id: stadiumId,
          },
        }),
        this.prisma.phase.findUnique({
          where: {
            phase_id: phaseId,
          },
        }),
      ]);

    if (!awayTeam) {
      throw new NotFoundException(
        `El equipo visitante con ID ${awayTeamId} no existe`,
      );
    }

    if (!homeTeam) {
      throw new NotFoundException(
        `El equipo local con ID ${homeTeamId} no existe`,
      );
    }

    if (!stadium) {
      throw new NotFoundException(
        `El estadio con ID ${stadiumId} no existe`,
      );
    }

    if (!phase) {
      throw new NotFoundException(
        `La fase con ID ${phaseId} no existe`,
      );
    }

    const matchDate =
      data.match_date !== undefined
        ? new Date(
            `${data.match_date}T00:00:00.000Z`,
          )
        : currentMatch.match_date;

    this.validateMatchDateInPhase(matchDate, phase);
    this.validateAttendance(
      data.attendance !== undefined
        ? data.attendance
        : currentMatch.attendance,
      stadium,
    );

    const seriesMatch: SeriesMatch = {
      match_id: id,
      phase_id: phaseId,
      away_team_id: awayTeamId,
      home_team_id: homeTeamId,
      away_score: data.away_score ?? currentMatch.away_score,
      home_score: data.home_score ?? currentMatch.home_score,
      tiebreaker: data.tiebreaker ?? currentMatch.tiebreaker,
      match_date: matchDate.toISOString().slice(0, 10),
    };

    try {
      const updatedMatch =
        await this.qualificationService.runConsistentWrite({
          focusMatchId: id,
          simulate: (snapshot) => ({
            ...snapshot,
            matches: snapshot.matches.map((match) =>
              match.match_id === id ? seriesMatch : match,
            ),
          }),
          write: (tx) =>
            tx.match.update({
              where: {
                match_id: id,
              },
              data: {
                ...(data.away_team_id !== undefined && {
                  away_team_id: data.away_team_id,
                }),
                ...(data.home_team_id !== undefined && {
                  home_team_id: data.home_team_id,
                }),
                ...(data.match_date !== undefined && {
                  match_date: matchDate,
                }),
                ...(data.stadium_id !== undefined && {
                  stadium_id: data.stadium_id,
                }),
                ...(data.phase_id !== undefined && {
                  phase_id: data.phase_id,
                }),
                ...(data.away_score !== undefined && {
                  away_score: data.away_score,
                }),
                ...(data.home_score !== undefined && {
                  home_score: data.home_score,
                }),
                ...(data.attendance !== undefined && {
                  attendance: data.attendance,
                }),
                ...(data.tiebreaker !== undefined && {
                  tiebreaker: data.tiebreaker,
                }),
              },
              include: matchInclude,
            }),
        });

      this.matchesEventsService.emit(
        'match.updated',
        updatedMatch,
      );

      return updatedMatch;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Uno de los registros relacionados con el partido no es válido',
        );
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2039'
      ) {
        throw new BadRequestException(
          'El partido no cumple una regla de negocio de la base de datos',
        );
      }

      throw error;
    }
  }

  async deleteMatch(id: number) {
    await this.getMatchById(id);

    const deletedMatch =
      await this.qualificationService.runConsistentWrite({
        simulate: (snapshot) => ({
          ...snapshot,
          matches: snapshot.matches.filter(
            (match) => match.match_id !== id,
          ),
        }),
        write: (tx) =>
          tx.match.delete({
            where: {
              match_id: id,
            },
          }),
      });

    this.matchesEventsService.emit(
      'match.deleted',
      deletedMatch,
    );

    return deletedMatch;
  }
}
