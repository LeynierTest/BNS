import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QualificationService } from '../qualification/qualification.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonTeamsDto } from './dto/update-season-teams.dto';
import { assertSeasonNotStarted } from './season-scope';

export type SeasonSummary = {
  season_id: number;
  name: string;
  series_id: number;
  series_name: string;
  created_at: Date;
  team_count: number;
  phase_count: number;
  match_count: number;
  /** Tiene algún partido: sus equipos ya no cambian. */
  started: boolean;
};

@Injectable()
export class SeasonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qualificationService: QualificationService,
  ) {}

  async getSeries() {
    return this.prisma.series.findMany({ orderBy: { name: 'asc' } });
  }

  /** Temporadas de todas las Series, la más reciente primero. */
  async getSeasons(): Promise<SeasonSummary[]> {
    const [seasons, matchCounts] = await Promise.all([
      this.prisma.season.findMany({
        orderBy: { season_id: 'desc' },
        include: {
          series: { select: { name: true } },
          _count: { select: { season_team: true, phase: true } },
        },
      }),
      this.prisma.$queryRaw<{ season_id: number; matches: number }[]>`
        SELECT p.season_id, COUNT(m.match_id)::int AS matches
        FROM match m
        JOIN phase p ON p.phase_id = m.phase_id
        GROUP BY p.season_id
      `,
    ]);
    const matchesBySeason = new Map(
      matchCounts.map((row) => [row.season_id, row.matches]),
    );

    return seasons.map((season) => {
      const matchCount = matchesBySeason.get(season.season_id) ?? 0;

      return {
        season_id: season.season_id,
        name: season.name,
        series_id: season.series_id,
        series_name: season.series.name,
        created_at: season.created_at,
        team_count: season._count.season_team,
        phase_count: season._count.phase,
        match_count: matchCount,
        started: matchCount > 0,
      };
    });
  }

  async getSeasonTeams(seasonId: number) {
    await this.getSeasonOrThrow(seasonId);

    return this.prisma.team.findMany({
      where: { season_team: { some: { season_id: seasonId } } },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Crea una temporada vacía (sin fases ni partidos) en una Serie existente
   * o en una nueva, con los equipos indicados o, por defecto, todos.
   */
  async createSeason(data: CreateSeasonDto) {
    if (data.series_id === undefined && data.series_name === undefined) {
      throw new BadRequestException(
        'Indica la Serie: series_id de una existente o series_name para crearla',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const seriesId = await this.resolveSeries(tx, data);
      const duplicate = await tx.season.findUnique({
        where: {
          series_id_name: { series_id: seriesId, name: data.name.trim() },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          `Ya existe la temporada ${data.name.trim()} en esa Serie`,
        );
      }

      const teamIds =
        data.team_ids ??
        (await tx.team.findMany({ select: { team_id: true } })).map(
          (team) => team.team_id,
        );

      await this.assertTeamsExist(tx, teamIds);

      const season = await tx.season.create({
        data: { series_id: seriesId, name: data.name.trim() },
      });

      await tx.season_team.createMany({
        data: teamIds.map((teamId) => ({
          season_id: season.season_id,
          team_id: teamId,
        })),
      });

      return season;
    });
  }

  /** Cambia los equipos inscritos; solo antes de que la temporada empiece. */
  async updateSeasonTeams(seasonId: number, data: UpdateSeasonTeamsDto) {
    await this.getSeasonOrThrow(seasonId);

    await this.qualificationService.runLocked(async (tx) => {
      await assertSeasonNotStarted(
        tx,
        seasonId,
        'cambiar los equipos inscritos',
      );
      await this.assertTeamsExist(tx, data.team_ids);

      await tx.season_team.deleteMany({ where: { season_id: seasonId } });
      await tx.season_team.createMany({
        data: data.team_ids.map((teamId) => ({
          season_id: seasonId,
          team_id: teamId,
        })),
      });
    });

    return this.getSeasonTeams(seasonId);
  }

  private async getSeasonOrThrow(seasonId: number) {
    const season = await this.prisma.season.findUnique({
      where: { season_id: seasonId },
    });

    if (!season) {
      throw new NotFoundException(`La temporada con ID ${seasonId} no existe`);
    }

    return season;
  }

  private async resolveSeries(
    tx: Prisma.TransactionClient,
    data: CreateSeasonDto,
  ): Promise<number> {
    if (data.series_id !== undefined) {
      const series = await tx.series.findUnique({
        where: { series_id: data.series_id },
      });

      if (!series) {
        throw new NotFoundException(
          `La Serie con ID ${data.series_id} no existe`,
        );
      }

      return series.series_id;
    }

    // Una Serie nueva con el nombre de otra ya existente reutiliza esa.
    const name = data.series_name!.trim();
    const series = await tx.series.upsert({
      where: { name },
      update: {},
      create: { name },
    });

    return series.series_id;
  }

  private async assertTeamsExist(
    tx: Prisma.TransactionClient,
    teamIds: number[],
  ) {
    if (teamIds.length < 2) {
      throw new BadRequestException(
        'Una temporada necesita al menos 2 equipos inscritos',
      );
    }

    const found = await tx.team.count({
      where: { team_id: { in: teamIds } },
    });

    if (found !== teamIds.length) {
      throw new BadRequestException('Alguno de los equipos indicados no existe');
    }
  }
}
