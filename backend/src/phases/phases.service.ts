import { PhasesEventsService } from './phases-events.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QualificationService } from '../qualification/qualification.service';
import { UNSAVED_ID } from '../qualification/series-qualification';
import { resolveSeasonId } from '../seasons/season-scope';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { UpdatePhaseDto } from './dto/update-phase.dto';
import { PHASE_NAMES, getPhaseOrder } from './series-phases';

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class PhasesService {
  constructor(private readonly prisma: PrismaService,
    private readonly phasesEventsService: PhasesEventsService,
    private readonly qualificationService: QualificationService) {}

  /**
   * Cada fase existe una sola vez por temporada y en su orden: empieza
   * después de que termine la anterior y termina antes de que empiece la
   * siguiente (los equipos activos de una fase salen de la anterior ya
   * terminada). Solo cuentan las fases de la misma temporada.
   */
  private async validateSeriesPlace(
    tx: Prisma.TransactionClient,
    seasonId: number,
    phaseId: number | null,
    name: string,
    startDate: Date,
    endDate: Date,
  ) {
    const otherPhases = await tx.phase.findMany({
      where: {
        season_id: seasonId,
        ...(phaseId !== null && {
          phase_id: {
            not: phaseId,
          },
        }),
      },
      select: {
        name: true,
        start_date: true,
        end_date: true,
      },
      orderBy: {
        start_date: 'asc',
      },
    });

    if (otherPhases.some((phase) => phase.name === name)) {
      throw new BadRequestException(
        `Ya existe la fase ${name}`,
      );
    }

    const order = getPhaseOrder(name);

    for (const other of otherPhases) {
      const otherOrder = getPhaseOrder(other.name);

      if (otherOrder === -1) {
        continue;
      }

      if (otherOrder < order && other.end_date >= startDate) {
        throw new BadRequestException(
          `La fase ${name} debe comenzar después de que termine ${other.name} (${toDateOnly(other.end_date)})`,
        );
      }

      if (otherOrder > order && other.start_date <= endDate) {
        throw new BadRequestException(
          `La fase ${name} debe terminar antes de que comience ${other.name} (${toDateOnly(other.start_date)})`,
        );
      }
    }
  }

  async searchPhases(
    name?: string,
    activeDate?: string,
    seasonId?: number,
  ) {
    const season = await resolveSeasonId(this.prisma, seasonId);

    return this.prisma.$queryRaw`
      SELECT *
      FROM search_phases(
        p_name => ${name ?? null},
        p_active_date => ${activeDate ?? null},
        p_season_id => ${season}
      )
    `;
  }

  /** Fases de una temporada (por defecto, la más reciente). */
  async getAllPhases(seasonId?: number) {
    return this.prisma.phase.findMany({
      where: {
        season_id: await resolveSeasonId(this.prisma, seasonId),
      },
      orderBy: {
        phase_id: 'asc',
      },
    });
  }

  async getPhaseById(id: number) {
    const phase = await this.prisma.phase.findUnique({
      where: {
        phase_id: id,
      },
      include: {
        _count: {
          select: {
            match: true,
          },
        },
      },
    });

    if (!phase) {
      throw new NotFoundException(
        `La fase con ID ${id} no existe`,
      );
    }

    return phase;
  }

  async createPhase(data: CreatePhaseDto) {
    const startDate = new Date(
      `${data.start_date}T00:00:00.000Z`,
    );
    const endDate = new Date(
      `${data.end_date}T00:00:00.000Z`,
    );

    if (endDate < startDate) {
      throw new BadRequestException(
        'La fecha de terminación no puede ser anterior a la fecha de comienzo',
      );
    }

    const seasonId = await resolveSeasonId(this.prisma, data.season_id);

    try {
      const createdPhase =
        await this.qualificationService.runConsistentWrite({
          seasonId,
          validate: (tx) =>
            this.validateSeriesPlace(
              tx,
              seasonId,
              null,
              data.name,
              startDate,
              endDate,
            ),
          simulate: (snapshot) => ({
            ...snapshot,
            phases: [
              ...snapshot.phases,
              { phase_id: UNSAVED_ID, name: data.name },
            ],
          }),
          write: (tx) =>
            tx.phase.create({
              data: {
                name: data.name,
                start_date: startDate,
                end_date: endDate,
                season_id: seasonId,
              },
            }),
        });

      this.phasesEventsService.emit('phase.created', createdPhase);

      return createdPhase;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Ya existe una fase con ese nombre',
        );
      }

      throw error;
    }
  }

  async updatePhase(
    id: number,
    data: UpdatePhaseDto,
  ) {
    const currentPhase = await this.prisma.phase.findUnique({
      where: {
        phase_id: id,
      },
    });

    if (!currentPhase) {
      throw new NotFoundException(
        `La fase con ID ${id} no existe`,
      );
    }

    const name = data.name ?? currentPhase.name;

    if (getPhaseOrder(name) === -1) {
      throw new BadRequestException(
        `La fase "${name}" no es una fase de la Serie: cámbiale el nombre a ${PHASE_NAMES.join(', ')}`,
      );
    }

    const startDate =
      data.start_date !== undefined
        ? new Date(
            `${data.start_date}T00:00:00.000Z`,
          )
        : currentPhase.start_date;

    const endDate =
      data.end_date !== undefined
        ? new Date(
            `${data.end_date}T00:00:00.000Z`,
          )
        : currentPhase.end_date;

    if (endDate < startDate) {
      throw new BadRequestException(
        'La fecha de terminación no puede ser anterior a la fecha de comienzo',
      );
    }

    const conflictingMatches =
      await this.prisma.match.findMany({
        where: {
          phase_id: id,
          OR: [
            {
              match_date: {
                lt: startDate,
              },
            },
            {
              match_date: {
                gt: endDate,
              },
            },
          ],
        },
        select: {
          match_id: true,
          match_date: true,
        },
        orderBy: {
          match_date: 'asc',
        },
      });

    if (conflictingMatches.length > 0) {
      throw new BadRequestException(
        `No se puede modificar el período de la fase porque existen ${conflictingMatches.length} partido(s) fuera del nuevo intervalo`,
      );
    }

    try {
      const updatedPhase =
        await this.qualificationService.runConsistentWrite({
          seasonId: currentPhase.season_id,
          validate: (tx) =>
            this.validateSeriesPlace(
              tx,
              currentPhase.season_id,
              id,
              name,
              startDate,
              endDate,
            ),
          simulate: (snapshot) => ({
            ...snapshot,
            phases: snapshot.phases.map((phase) =>
              phase.phase_id === id ? { phase_id: id, name } : phase,
            ),
          }),
          write: (tx) =>
            tx.phase.update({
              where: {
                phase_id: id,
              },
              data: {
                ...(data.name !== undefined && {
                  name: data.name,
                }),
                ...(data.start_date !== undefined && {
                  start_date: startDate,
                }),
                ...(data.end_date !== undefined && {
                  end_date: endDate,
                }),
              },
            }),
        });

      this.phasesEventsService.emit('phase.updated', updatedPhase);

      return updatedPhase;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Ya existe una fase con ese nombre',
        );
      }

      throw error;
    }
  }

  async deletePhase(id: number) {
    const phase = await this.getPhaseById(id);

    if (phase._count.match > 0) {
      throw new BadRequestException(
        `No se puede eliminar la fase porque tiene ${phase._count.match} partido(s) asociado(s)`,
      );
    }

    const deletedPhase =
      await this.qualificationService.runConsistentWrite({
        seasonId: phase.season_id,
        simulate: (snapshot) => ({
          ...snapshot,
          phases: snapshot.phases.filter(
            (current) => current.phase_id !== id,
          ),
        }),
        write: (tx) =>
          tx.phase.delete({
            where: {
              phase_id: id,
            },
          }),
      });

    this.phasesEventsService.emit('phase.deleted', deletedPhase);

    return deletedPhase;
  }
}
