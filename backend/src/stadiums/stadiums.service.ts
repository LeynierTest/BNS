import { StadiumsEventsService } from './stadiums-events.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStadiumDto } from './dto/create-stadium.dto';
import { UpdateStadiumDto } from './dto/update-stadium.dto';

@Injectable()
export class StadiumsService {
  constructor(private readonly prisma: PrismaService,
    private readonly stadiumsEventsService: StadiumsEventsService) {}

  async searchStadiums(
    name?: string,
    province?: string,
    capacity?: number,
  ) {
    return this.prisma.$queryRaw`
      SELECT *
      FROM search_stadiums(
        p_name => ${name ?? null},
        p_province => ${province ?? null},
        p_capacity => ${capacity ?? null}
      )
    `;
  }

  async getAllStadiums() {
    return this.prisma.stadium.findMany({
      orderBy: {
        stadium_id: 'asc',
      },
    });
  }

  async getStadiumById(id: number) {
    const stadium = await this.prisma.stadium.findUnique({
      where: {
        stadium_id: id,
      },
      include: {
        _count: {
          select: {
            match: true,
          },
        },
      },
    });

    if (!stadium) {
      throw new NotFoundException(
        `El estadio con ID ${id} no existe`,
      );
    }

    return stadium;
  }

  async createStadium(data: CreateStadiumDto) {
    try {
      const createdStadium = await this.prisma.stadium.create({
        data: {
          name: data.name,
          capacity: data.capacity,
          province: data.province,
        },
      });

      this.stadiumsEventsService.emit('stadium.created', createdStadium);

      return createdStadium;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Ya existe un estadio con los mismos datos únicos',
        );
      }

      throw error;
    }
  }

  async updateStadium(
    id: number,
    data: UpdateStadiumDto,
  ) {
    const currentStadium = await this.prisma.stadium.findUnique({
      where: {
        stadium_id: id,
      },
    });

    if (!currentStadium) {
      throw new NotFoundException(
        `El estadio con ID ${id} no existe`,
      );
    }

    if (data.capacity !== undefined) {
      const maxAttendance = await this.prisma.match.aggregate({
        where: {
          stadium_id: id,
        },
        _max: {
          attendance: true,
        },
      });

      if (
        maxAttendance._max.attendance !== null &&
        data.capacity < maxAttendance._max.attendance
      ) {
        throw new BadRequestException(
          `La capacidad no puede ser menor que la mayor audiencia registrada (${maxAttendance._max.attendance})`,
        );
      }
    }

    try {
      const updatedStadium = await this.prisma.stadium.update({
        where: {
          stadium_id: id,
        },
        data: {
          ...(data.name !== undefined && {
            name: data.name,
          }),
          ...(data.capacity !== undefined && {
            capacity: data.capacity,
          }),
          ...(data.province !== undefined && {
            province: data.province,
          }),
        },
      });

      this.stadiumsEventsService.emit('stadium.updated', updatedStadium);

      return updatedStadium;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Ya existe un estadio con los mismos datos únicos',
        );
      }

      throw error;
    }
  }

  async deleteStadium(id: number) {
    await this.getStadiumById(id);

    try {
      const deletedStadium = await this.prisma.stadium.delete({
        where: {
          stadium_id: id,
        },
      });

      this.stadiumsEventsService.emit('stadium.deleted', deletedStadium);

      return deletedStadium;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          'No se puede eliminar el estadio porque tiene partidos asociados',
        );
      }

      throw error;
    }
  }
}
