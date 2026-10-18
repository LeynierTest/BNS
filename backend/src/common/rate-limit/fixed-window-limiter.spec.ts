import { HttpStatus } from '@nestjs/common';
import { FixedWindowLimiter, tooManyRequests } from './fixed-window-limiter';

describe('FixedWindowLimiter', () => {
  let now: number;
  let limiter: FixedWindowLimiter;

  beforeEach(() => {
    now = 1_000_000;
    limiter = new FixedWindowLimiter(3, 60_000, () => now);
  });

  it('bloquea al llegar al límite dentro de la ventana', () => {
    limiter.hit('a');
    limiter.hit('a');
    expect(limiter.blockedFor('a')).toBe(0);

    limiter.hit('a');
    expect(limiter.blockedFor('a')).toBe(60_000);

    now += 15_000;
    expect(limiter.blockedFor('a')).toBe(45_000);
  });

  it('libera la clave cuando termina la ventana', () => {
    limiter.hit('a');
    limiter.hit('a');
    limiter.hit('a');

    now += 60_000;
    expect(limiter.blockedFor('a')).toBe(0);

    limiter.hit('a');
    expect(limiter.blockedFor('a')).toBe(0);
  });

  it('cuenta cada clave por separado y reset la libera', () => {
    limiter.hit('a');
    limiter.hit('a');
    limiter.hit('a');
    limiter.hit('b');

    expect(limiter.blockedFor('b')).toBe(0);

    limiter.reset('a');
    expect(limiter.blockedFor('a')).toBe(0);
  });
});

describe('tooManyRequests', () => {
  it('responde 429 con los minutos de espera redondeados hacia arriba', () => {
    const error = tooManyRequests('Demasiados intentos', 61_000);

    expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(error.message).toBe(
      'Demasiados intentos. Inténtalo de nuevo en 2 minutos',
    );
    expect(tooManyRequests('Espera', 5_000).message).toBe(
      'Espera. Inténtalo de nuevo en 1 minuto',
    );
  });
});
