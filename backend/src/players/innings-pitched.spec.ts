import { isBaseballInnings } from './innings-pitched';

describe('isBaseballInnings', () => {
  it.each([0, 1, 90, 90.1, 90.2, 0.2, 9999.2])('acepta %p', (value) => {
    expect(isBaseballInnings(value)).toBe(true);
  });

  it.each([
    ['un tercer out (.3 son 3 outs = otra entrada)', 90.3],
    ['décimas de entrada', 90.5],
    ['centésimas', 90.25],
    ['un negativo', -1],
    ['un texto', '90.2'],
    ['NaN', Number.NaN],
  ])('rechaza %s', (_label, value) => {
    expect(isBaseballInnings(value)).toBe(false);
  });
});
