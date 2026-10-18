import { HttpException, HttpStatus } from '@nestjs/common';

type Window = {
  count: number;
  resetAt: number;
};

/** Por encima de este número de claves se descartan las ventanas vencidas. */
const PRUNE_THRESHOLD = 10_000;

/**
 * Cuenta intentos por clave en ventanas fijas: la primera vez que se usa una
 * clave empieza una ventana de `windowMs`, y al llegar a `limit` intentos la
 * clave queda bloqueada hasta que la ventana termina.
 *
 * Vive en la memoria del proceso: basta para una sola instancia del backend.
 * Con varias instancias haría falta un almacén compartido (p. ej. Redis).
 */
export class FixedWindowLimiter {
  private readonly windows = new Map<string, Window>();

  constructor(
    readonly limit: number,
    readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Milisegundos hasta que la clave admita intentos de nuevo (0 = libre). */
  blockedFor(key: string): number {
    const window = this.current(key);

    return window && window.count >= this.limit
      ? window.resetAt - this.now()
      : 0;
  }

  hit(key: string): void {
    const window = this.current(key);

    if (window) {
      window.count += 1;
      return;
    }

    if (this.windows.size >= PRUNE_THRESHOLD) {
      this.prune();
    }

    this.windows.set(key, {
      count: 1,
      resetAt: this.now() + this.windowMs,
    });
  }

  reset(key: string): void {
    this.windows.delete(key);
  }

  private current(key: string): Window | undefined {
    const window = this.windows.get(key);

    if (window && window.resetAt <= this.now()) {
      this.windows.delete(key);
      return undefined;
    }

    return window;
  }

  private prune() {
    const now = this.now();

    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) {
        this.windows.delete(key);
      }
    }
  }
}

/** 429 con el tiempo de espera redondeado a minutos. */
export function tooManyRequests(
  message: string,
  retryInMs: number,
): HttpException {
  const minutes = Math.max(1, Math.ceil(retryInMs / 60_000));

  return new HttpException(
    `${message}. Inténtalo de nuevo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`,
    HttpStatus.TOO_MANY_REQUESTS,
  );
}
