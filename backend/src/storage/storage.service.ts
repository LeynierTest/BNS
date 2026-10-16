import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import sharp from 'sharp';

export const AVATARS_DIR = join(
  process.cwd(),
  'uploads',
  'avatars',
);

export const AVATAR_URL_PREFIX = '/uploads/avatars';

const AVATAR_SIZE = 256;
const AVATAR_QUALITY = 82;

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  async onModuleInit(): Promise<void> {
    await mkdir(AVATARS_DIR, { recursive: true });
  }

  /**
   * Normaliza la imagen a WebP 256x256 (recorte centrado), le quita los
   * metadatos EXIF y la guarda en disco. Devuelve la ruta pública.
   */
  async saveAvatar(
    userId: number,
    buffer: Buffer,
  ): Promise<string> {
    await mkdir(AVATARS_DIR, { recursive: true });

    const filename = `${userId}-${randomUUID()}.webp`;
    const target = join(AVATARS_DIR, filename);

    try {
      await sharp(buffer)
        .rotate()
        .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover' })
        .webp({ quality: AVATAR_QUALITY })
        .toFile(target);
    } catch {
      throw new BadRequestException(
        'El archivo no es una imagen válida',
      );
    }

    return `${AVATAR_URL_PREFIX}/${filename}`;
  }

  /**
   * Elimina la foto indicada por su ruta pública. Es tolerante a
   * errores: si el archivo no existe, no falla.
   */
  async removeAvatar(
    photoUrl?: string | null,
  ): Promise<void> {
    if (!photoUrl) {
      return;
    }

    const target = join(AVATARS_DIR, basename(photoUrl));

    if (dirname(target) !== AVATARS_DIR) {
      return;
    }

    try {
      await unlink(target);
    } catch (error) {
      const code =
        (error as NodeJS.ErrnoException).code;

      if (code !== 'ENOENT') {
        this.logger.warn(
          `No se pudo eliminar el archivo ${target}: ${String(error)}`,
        );
      }
    }
  }
}
