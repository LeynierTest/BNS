import { CoachesEventsService } from './coaches-events.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';

@Injectable()
export class CoachesService {
  constructor(private readonly prisma: PrismaService,
    private readonly coachesEventsService: CoachesEventsService) {}

  async getAllCoaches() {
    return this.prisma.coach.findMany({
      orderBy: {
        team_member_id: 'asc',
      },
      include: {
        team_member: {
          include: {
            team: true,
          },
        },
      },
    });
  }

  async searchCoaches(
    number?: number,
    name?: string,
    team?: string,
    yearsOnTeam?: number,
    yearsExperience?: number,
  ) {
    return this.prisma.$queryRaw`
      SELECT *
      FROM search_coaches(
        p_number => ${number ?? null},
        p_name => ${name ?? null},
        p_team => ${team ?? null},
        p_years_on_team => ${yearsOnTeam ?? null},
        p_years_experience => ${yearsExperience ?? null}
      )
    `;
  }

  async getCoachById(id: number) {
    const coach = await this.prisma.coach.findUnique({
      where: {
        team_member_id: id,
      },
      include: {
        team_member: {
          include: {
            team: true,
          },
        },
      },
    });

    if (!coach) {
      throw new NotFoundException(
        `El entrenador con ID ${id} no existe`,
      );
    }

    return coach;
  }

  async createCoach(data: CreateCoachDto) {
    const team = await this.prisma.team.findUnique({
      where: {
        team_id: data.team_id,
      },
    });

    if (!team) {
      throw new NotFoundException(
        `El equipo con ID ${data.team_id} no existe`,
      );
    }

    try {
      const createdCoach = await this.prisma.$transaction(async (tx) => {
        const teamMember = await tx.team_member.create({
          data: {
            name: data.name,
            number: data.number,
            years_on_team: data.years_on_team,
            team_id: data.team_id,
          },
        });

        return tx.coach.create({
          data: {
            team_member_id: teamMember.team_member_id,
            years_experience: data.years_experience,
          },
          include: {
            team_member: {
              include: {
                team: true,
              },
            },
          },
        });
      });

      this.coachesEventsService.emit('coach.created', createdCoach);

      return createdCoach;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          `El número ${data.number} ya está registrado para el equipo ${data.team_id}`,
        );
      }

      throw error;
    }
  }

  async updateCoach(
    id: number,
    data: UpdateCoachDto,
  ) {
    await this.getCoachById(id);

    if (data.team_id !== undefined) {
      const team = await this.prisma.team.findUnique({
        where: {
          team_id: data.team_id,
        },
      });

      if (!team) {
        throw new NotFoundException(
          `El equipo con ID ${data.team_id} no existe`,
        );
      }
    }

    try {
      const updatedCoach = await this.prisma.$transaction(async (tx) => {
        await tx.team_member.update({
          where: {
            team_member_id: id,
          },
          data: {
            ...(data.name !== undefined && {
              name: data.name,
            }),
            ...(data.number !== undefined && {
              number: data.number,
            }),
            ...(data.years_on_team !== undefined && {
              years_on_team: data.years_on_team,
            }),
            ...(data.team_id !== undefined && {
              team_id: data.team_id,
            }),
          },
        });

        return tx.coach.update({
          where: {
            team_member_id: id,
          },
          data: {
            ...(data.years_experience !== undefined && {
              years_experience: data.years_experience,
            }),
          },
          include: {
            team_member: {
              include: {
                team: true,
              },
            },
          },
        });
      });

      this.coachesEventsService.emit('coach.updated', updatedCoach);

      return updatedCoach;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'El número indicado ya está registrado para ese equipo',
        );
      }

      throw error;
    }
  }

  async deleteCoach(id: number) {
    await this.getCoachById(id);

    const deletedCoach = await this.prisma.$transaction(async (tx) => {
      const coach = await tx.coach.delete({
        where: {
          team_member_id: id,
        },
      });

      await tx.team_member.delete({
        where: {
          team_member_id: id,
        },
      });

      return coach;
    });

    this.coachesEventsService.emit('coach.deleted', deletedCoach);

    return deletedCoach;
  }
}
