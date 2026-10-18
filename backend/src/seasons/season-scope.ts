import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

type Client = Prisma.TransactionClient;

/**
 * Temporada a la que se refiere una petición: la indicada o, si no se
 * indica, la más reciente (la migración de temporadas garantiza que siempre
 * hay al menos una).
 */
export async function resolveSeasonId(
  client: Client,
  seasonId?: number,
): Promise<number> {
  if (seasonId !== undefined) {
    const season = await client.season.findUnique({
      where: { season_id: seasonId },
      select: { season_id: true },
    });

    if (!season) {
      throw new NotFoundException(`La temporada con ID ${seasonId} no existe`);
    }

    return season.season_id;
  }

  const latest = await client.season.findFirst({
    orderBy: { season_id: 'desc' },
    select: { season_id: true },
  });

  if (!latest) {
    throw new NotFoundException('No hay ninguna temporada creada');
  }

  return latest.season_id;
}

/** Una temporada empieza con su primer partido registrado. */
export async function isSeasonStarted(
  client: Client,
  seasonId: number,
): Promise<boolean> {
  const matches = await client.match.count({
    where: { phase: { season_id: seasonId } },
  });

  return matches > 0;
}

/**
 * Los equipos de una temporada solo cambian antes de que empiece: después
 * cambiaría quién juega una competición en curso (decisión del equipo).
 */
export async function assertSeasonNotStarted(
  client: Client,
  seasonId: number,
  action: string,
): Promise<void> {
  if (await isSeasonStarted(client, seasonId)) {
    const season = await client.season.findUniqueOrThrow({
      where: { season_id: seasonId },
      select: { name: true, series: { select: { name: true } } },
    });

    throw new BadRequestException(
      `La temporada ${season.name} de ${season.series.name} ya empezó (tiene partidos registrados): no se permite ${action}`,
    );
  }
}
