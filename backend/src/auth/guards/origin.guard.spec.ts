import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ACCESS_TOKEN_COOKIE } from '../auth.constants';
import { OriginGuard } from './origin.guard';

type FakeRequest = {
  method: string;
  cookies?: Record<string, string>;
  headers: {
    origin?: string;
    referer?: string;
  };
};

function contextFor(request: FakeRequest): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

const withSession = {
  [ACCESS_TOKEN_COOKIE]: 'jwt',
};

describe('OriginGuard', () => {
  const guard = new OriginGuard();
  const previousOrigin = process.env.FRONTEND_ORIGIN;

  beforeEach(() => {
    process.env.FRONTEND_ORIGIN =
      'http://localhost:5173, https://bns.example.cu/';
  });

  afterAll(() => {
    process.env.FRONTEND_ORIGIN = previousOrigin;
  });

  it('deja pasar métodos seguros aunque el origen sea ajeno', () => {
    expect(
      guard.canActivate(
        contextFor({
          method: 'GET',
          cookies: withSession,
          headers: { origin: 'http://evil.test' },
        }),
      ),
    ).toBe(true);
  });

  it('deja pasar mutaciones sin cookie de sesión (login o Bearer)', () => {
    expect(
      guard.canActivate(
        contextFor({
          method: 'POST',
          headers: { origin: 'http://evil.test' },
        }),
      ),
    ).toBe(true);
  });

  it('acepta mutaciones con cookie desde un origen permitido', () => {
    expect(
      guard.canActivate(
        contextFor({
          method: 'DELETE',
          cookies: withSession,
          headers: { origin: 'https://bns.example.cu' },
        }),
      ),
    ).toBe(true);
  });

  it('usa el Referer cuando falta Origin', () => {
    expect(
      guard.canActivate(
        contextFor({
          method: 'PATCH',
          cookies: withSession,
          headers: {
            referer: 'http://localhost:5173/teams?page=2',
          },
        }),
      ),
    ).toBe(true);
  });

  it.each([
    ['otro puerto del mismo sitio', { origin: 'http://localhost:8080' }],
    ['origen ajeno', { origin: 'http://evil.test' }],
    ['origen opaco', { origin: 'null' }],
    ['Referer malformado', { referer: 'no es una url' }],
    ['sin Origin ni Referer', {}],
  ])(
    'rechaza mutaciones con cookie: %s',
    (_label, headers: FakeRequest['headers']) => {
      expect(() =>
        guard.canActivate(
          contextFor({
            method: 'POST',
            cookies: withSession,
            headers,
          }),
        ),
      ).toThrow(ForbiddenException);
    },
  );
});
