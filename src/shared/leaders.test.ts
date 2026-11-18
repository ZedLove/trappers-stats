import { describe, expect, it } from 'vitest';
import { type LeaderRow, leadersFor } from './leaders';
import { type DerivedStats } from './stats';

function row(
  playerId: string,
  name: string,
  overrides: Partial<DerivedStats> = {},
): LeaderRow {
  return {
    playerId,
    name,
    g: 1,
    pa: 4,
    ab: 4,
    r: 0,
    h: 0,
    singles: 0,
    doubles: 0,
    triples: 0,
    hr: 0,
    tb: 0,
    bb: 0,
    sf: 0,
    k: 0,
    avg: 0.25,
    obp: 0.4,
    slg: 0.25,
    ops: 0.65,
    ...overrides,
  };
}

describe('leadersFor', () => {
  it('returns the single top player for a counting stat', () => {
    const rows = [
      row('a', 'Alpha', { hr: 2 }),
      row('b', 'Beta', { hr: 5 }),
      row('c', 'Gamma', { hr: 1 }),
    ];
    const result = leadersFor(rows, 'hr');
    expect(result.value).toBe(5);
    expect(result.leaders.map((leader) => leader.name)).toEqual(['Beta']);
  });

  it('returns everyone tied at the top value', () => {
    const rows = [
      row('a', 'Alpha', { hr: 3 }),
      row('b', 'Beta', { hr: 3 }),
      row('c', 'Gamma', { hr: 1 }),
    ];
    const result = leadersFor(rows, 'hr');
    expect(result.value).toBe(3);
    expect(result.leaders.map((leader) => leader.name)).toEqual(['Alpha', 'Beta']);
  });

  it('excludes null rate stats and returns empty when nobody qualifies', () => {
    const rows = [
      row('a', 'Alpha', { avg: null, obp: null, slg: null, ops: null }),
      row('b', 'Beta', { avg: null, obp: null, slg: null, ops: null }),
    ];
    expect(leadersFor(rows, 'avg')).toEqual({ value: null, leaders: [] });
  });

  it('ignores null rates when ranking, then returns the best qualifier', () => {
    const rows = [
      row('a', 'Alpha', { avg: null, obp: null, slg: null, ops: null }),
      row('b', 'Beta', { avg: 0.333 }),
    ];
    const result = leadersFor(rows, 'avg');
    expect(result.value).toBe(0.333);
    expect(result.leaders.map((leader) => leader.name)).toEqual(['Beta']);
  });

  it('returns empty for an empty set of rows', () => {
    expect(leadersFor([], 'bb')).toEqual({ value: null, leaders: [] });
  });

  it('ranks the singles, doubles, triples and walks categories', () => {
    const rows = [
      row('a', 'Alpha', { singles: 4, doubles: 1, triples: 0, bb: 2 }),
      row('b', 'Beta', { singles: 2, doubles: 3, triples: 1, bb: 5 }),
    ];
    expect(leadersFor(rows, 'singles').leaders[0].name).toBe('Alpha');
    expect(leadersFor(rows, 'doubles').leaders[0].name).toBe('Beta');
    expect(leadersFor(rows, 'triples').leaders[0].name).toBe('Beta');
    expect(leadersFor(rows, 'bb').leaders[0].name).toBe('Beta');
  });
});
