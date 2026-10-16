import { PhasesEventsService } from './phases-events.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { UpdatePhaseDto } from './dto/update-phase.dto';

@Injectable()
export class PhasesService {
  constructor(private readonly prisma: PrismaService,
    private readonly phasesEventsService: PhasesEventsService) {}

  async searchPhases(
    name?: string,
    activeDate?: string,
  ) {
    return this.prisma.$queryRaw`
      SELECT *
      FROM search_phases(
        p_name => ${name ?? null},
        p_active_date => ${activeDate ?? null}
      )
    `;
  }

  async getAllPhases() {
    return this.prisma.phase.findMany({
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

    try {
      const createdPhase = await this.prisma.phase.create({
        data: {
          name: data.name,
          start_date: startDate,
          end_date: endDate,
        },
      });

      this.phasesEventsService.emit('phase.created', createdPhase);

      return createdPhase;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Ya existe una fase con los mismos datos únicos',
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
      const updatedPhase = await this.prisma.phase.update({
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
      });

      this.phasesEventsService.emit('phase.updated', updatedPhase);

      return updatedPhase;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Ya existe una fase con los mismos datos únicos',
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

    const deletedPhase = await this.prisma.phase.delete({
      where: {
        phase_id: id,
      },
    });

    this.phasesEventsService.emit('phase.deleted', deletedPhase);

    return deletedPhase;
  }
}
