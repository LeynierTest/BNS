import { describe, expect, it } from 'vitest';
import { computeBattingAverage, isBaseballInnings } from './player';

describe('isBaseballInnings (misma regla que el backend)', () => {
  it.each([0, 90, 90.1, 90.2])('acepta %p', (value) => {
    expect(isBaseballInnings(value)).toBe(true);
  });

  it.each([90.3, 90.5, 90.25, -1, Number.NaN])('rechaza %p', (value) => {
    expect(isBaseballInnings(value)).toBe(false);
  });
});

describe('computeBattingAverage (como el trigger compute_batting_average)', () => {
  it.each([
    [7, 2, 0.286],
    [100, 35, 0.35],
    [16, 1, 0.063],
    [4, 4, 1],
  ])('%i turnos y %i hits → %p', (atBats, hits, expected) => {
    expect(computeBattingAverage(atBats, hits)).toBe(expected);
  });

  it('sin turnos al bate o con más hits que turnos no hay promedio', () => {
    expect(computeBattingAverage(0, 0)).toBeNull();
    expect(computeBattingAverage(3, 4)).toBeNull();
  });
});
