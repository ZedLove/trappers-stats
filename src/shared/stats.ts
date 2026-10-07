import type { PlayerLine } from './schema';

export interface CountingStats {
  g: number;
  ab: number;
  singles: number;
  doubles: number;
  triples: number;
  hr: number;
  h: number;
  tb: number;
  bb: number;
  sf: number;
  k: number;
  r: number;
  pa: number;
}

export interface DerivedStats extends CountingStats {
  avg: number | null;
  obp: number | null;
  slg: number | null;
  ops: number | null;
}

export function sumLines(lines: PlayerLine[]): CountingStats {
  const sums = lines.reduce(
    (acc, line) => ({
      ab: acc.ab + line.ab,
      singles: acc.singles + line['1b'],
      doubles: acc.doubles + line['2b'],
      triples: acc.triples + line['3b'],
      hr: acc.hr + line.hr,
      bb: acc.bb + line.bb,
      sf: acc.sf + line.sf,
      k: acc.k + line.k,
      r: acc.r + line.r,
    }),
    {
      ab: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      hr: 0,
      bb: 0,
      sf: 0,
      k: 0,
      r: 0,
    },
  );

  const h = sums.singles + sums.doubles + sums.triples + sums.hr;
  const tb = sums.singles + sums.doubles * 2 + sums.triples * 3 + sums.hr * 4;

  return {
    g: lines.length,
    ab: sums.ab,
    singles: sums.singles,
    doubles: sums.doubles,
    triples: sums.triples,
    hr: sums.hr,
    h,
    tb,
    bb: sums.bb,
    sf: sums.sf,
    k: sums.k,
    r: sums.r,
    pa: sums.ab + sums.bb + sums.sf,
  };
}

export function deriveStats(counts: CountingStats): DerivedStats {
  const avg = counts.ab > 0 ? counts.h / counts.ab : null;
  const obp = counts.pa > 0 ? (counts.h + counts.bb) / counts.pa : null;
  const slg = counts.ab > 0 ? counts.tb / counts.ab : null;
  const ops = obp !== null && slg !== null ? obp + slg : null;

  return {
    ...counts,
    avg,
    obp,
    slg,
    ops,
  };
}

export function formatRate(value: number | null): string {
  if (value === null) {
    return '—';
  }

  const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
  const fixed = rounded.toFixed(3);
  return rounded < 1 ? fixed.slice(1) : fixed;
}
