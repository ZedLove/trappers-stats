import { describe, it, expect } from 'vitest';
import type { PlayerLine } from './schema';
import { type CountingStats, type DerivedStats, sumLines, deriveStats, formatRate } from './stats';

function line(overrides: Partial<PlayerLine> = {}): PlayerLine {
  return {
    playerId: 'p1',
    ab: 0,
    '1b': 0,
    '2b': 0,
    '3b': 0,
    hr: 0,
    bb: 0,
    sf: 0,
    k: 0,
    r: 0,
    ...overrides,
  };
}

describe('sumLines', () => {
  it('returns all zeros for an empty array, including g: 0 and pa: 0', () => {
    const result: CountingStats = sumLines([]);
    expect(result).toEqual({
      g: 0,
      ab: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      hr: 0,
      h: 0,
      tb: 0,
      bb: 0,
      sf: 0,
      k: 0,
      r: 0,
      pa: 0,
    });
  });

  it('counts one line per game and sums every counting category', () => {
    const result = sumLines([
      line({ ab: 4, '1b': 2, '2b': 1, '3b': 0, hr: 0, bb: 1, sf: 1, k: 1, r: 2 }),
      line({ ab: 3, '1b': 1, '2b': 0, '3b': 1, hr: 1, bb: 0, sf: 0, k: 0, r: 1 }),
    ]);

    expect(result).toEqual({
      g: 2,
      ab: 7,
      singles: 3,
      doubles: 1,
      triples: 1,
      hr: 1,
      h: 6,
      tb: 12,
      bb: 1,
      sf: 1,
      k: 1,
      r: 3,
      pa: 9,
    });
  });

  it('computes h as singles + doubles + triples + hr', () => {
    const result = sumLines([line({ '1b': 2, '2b': 1, '3b': 1, hr: 1 })]);
    expect(result.h).toBe(5);
  });

  it('weights total bases as 1b + 2·2b + 3·3b + 4·hr', () => {
    const result = sumLines([line({ '1b': 1, '2b': 2, '3b': 1, hr: 1 })]);
    expect(result.tb).toBe(1 + 4 + 3 + 4);
  });

  it('computes pa as ab + bb + sf', () => {
    const result = sumLines([line({ ab: 3, bb: 1, sf: 1 })]);
    expect(result.pa).toBe(5);
  });

  it('sets g to the number of lines', () => {
    const result = sumLines([line(), line(), line()]);
    expect(result.g).toBe(3);
  });
});

describe('deriveStats', () => {
  it('returns null avg, slg, and ops when AB is zero but OBP is defined', () => {
    const result: DerivedStats = deriveStats({
      g: 1,
      ab: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      hr: 0,
      h: 0,
      tb: 0,
      bb: 2,
      sf: 0,
      k: 0,
      r: 0,
      pa: 2,
    });

    expect(result.avg).toBeNull();
    expect(result.obp).toBe(1);
    expect(result.slg).toBeNull();
    expect(result.ops).toBeNull();
  });

  it('returns obp 0 when AB=0, BB=0, and SF=1', () => {
    const result = deriveStats({
      g: 1,
      ab: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      hr: 0,
      h: 0,
      tb: 0,
      bb: 0,
      sf: 1,
      k: 0,
      r: 0,
      pa: 1,
    });

    expect(result.obp).toBe(0);
    expect(result.avg).toBeNull();
    expect(result.slg).toBeNull();
    expect(result.ops).toBeNull();
  });

  it('excludes sacrifice flies from the AVG denominator', () => {
    const result = deriveStats({
      g: 1,
      ab: 3,
      singles: 1,
      doubles: 0,
      triples: 0,
      hr: 0,
      h: 1,
      tb: 1,
      bb: 0,
      sf: 1,
      k: 0,
      r: 0,
      pa: 4,
    });

    expect(result.avg).toBeCloseTo(1 / 3, 10);
  });

  it('allows slugging greater than one (one HR in two AB)', () => {
    const result = deriveStats({
      g: 1,
      ab: 2,
      singles: 0,
      doubles: 0,
      triples: 0,
      hr: 1,
      h: 1,
      tb: 4,
      bb: 0,
      sf: 0,
      k: 0,
      r: 0,
      pa: 2,
    });

    expect(result.slg).toBe(2);
  });

  it('computes avg, obp, slg, and ops for a normal mixed line', () => {
    const result = deriveStats({
      g: 1,
      ab: 5,
      singles: 2,
      doubles: 1,
      triples: 0,
      hr: 0,
      h: 3,
      tb: 4,
      bb: 1,
      sf: 1,
      k: 0,
      r: 0,
      pa: 7,
    });

    expect(result.avg).toBeCloseTo(3 / 5, 10);
    expect(result.obp).toBeCloseTo(4 / 7, 10);
    expect(result.slg).toBeCloseTo(4 / 5, 10);
    expect(result.ops).toBeCloseTo(4 / 7 + 4 / 5, 10);
  });

  it('returns null obp when there are no plate appearances', () => {
    const result = deriveStats({
      g: 0,
      ab: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      hr: 0,
      h: 0,
      tb: 0,
      bb: 0,
      sf: 0,
      k: 0,
      r: 0,
      pa: 0,
    });

    expect(result.obp).toBeNull();
  });

  it('with SF > 0 and BB = 0, OBP is strictly less than AVG', () => {
    const result = deriveStats({
      g: 1,
      ab: 4,
      singles: 2,
      doubles: 0,
      triples: 0,
      hr: 0,
      h: 2,
      tb: 2,
      bb: 0,
      sf: 1,
      k: 0,
      r: 0,
      pa: 5,
    });

    expect(result.avg).toBe(0.5);
    expect(result.obp).toBe(0.4);
    expect(result.obp).toBeLessThan(result.avg as number);
  });
});

describe('formatRate', () => {
  it('formats null as an em dash', () => {
    expect(formatRate(null)).toBe('—');
  });

  it('rounds 1/3 down to .333', () => {
    const stats = deriveStats({
      g: 1,
      ab: 3,
      singles: 1,
      doubles: 0,
      triples: 0,
      hr: 0,
      h: 1,
      tb: 1,
      bb: 0,
      sf: 0,
      k: 0,
      r: 0,
      pa: 3,
    });

    expect(formatRate(stats.avg)).toBe('.333');
  });

  it('rounds 2/3 up to .667', () => {
    const stats = deriveStats({
      g: 1,
      ab: 3,
      singles: 0,
      doubles: 1,
      triples: 0,
      hr: 0,
      h: 2,
      tb: 2,
      bb: 0,
      sf: 0,
      k: 0,
      r: 0,
      pa: 3,
    });

    expect(formatRate(stats.avg)).toBe('.667');
  });

  it('rounds exact halves up (1/16 -> .063)', () => {
    const stats = deriveStats({
      g: 1,
      ab: 16,
      singles: 1,
      doubles: 0,
      triples: 0,
      hr: 0,
      h: 1,
      tb: 1,
      bb: 0,
      sf: 0,
      k: 0,
      r: 0,
      pa: 16,
    });

    expect(formatRate(stats.avg)).toBe('.063');
  });

  it('formats 1 as 1.000', () => {
    const stats = deriveStats({
      g: 1,
      ab: 1,
      singles: 1,
      doubles: 0,
      triples: 0,
      hr: 0,
      h: 1,
      tb: 1,
      bb: 0,
      sf: 0,
      k: 0,
      r: 0,
      pa: 1,
    });

    expect(formatRate(stats.slg)).toBe('1.000');
  });

  it('formats 2 as 2.000', () => {
    const stats = deriveStats({
      g: 1,
      ab: 2,
      singles: 0,
      doubles: 0,
      triples: 0,
      hr: 1,
      h: 1,
      tb: 4,
      bb: 0,
      sf: 0,
      k: 0,
      r: 0,
      pa: 2,
    });

    expect(formatRate(stats.slg)).toBe('2.000');
  });

  it('formats 0 as .000', () => {
    expect(formatRate(0)).toBe('.000');
  });

  it('rounds 0.3474 down to .347', () => {
    expect(formatRate(0.3474)).toBe('.347');
  });

  it('rounds 0.3475 up to .348 with half-up rounding', () => {
    expect(formatRate(0.3475)).toBe('.348');
  });
});
