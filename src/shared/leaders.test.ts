import { describe, expect, it } from 'vitest';
import { type LeaderRow, leadersFor } from './leaders';
import type { DerivedStats } from './stats';

function row(playerId: string, name: string, overrides: Partial<DerivedStats> = {}): LeaderRow {
  return {
    playerId,
    name,
    g: 10,
    pa: 20,
    ab: 18,
    r: 0,
    h: 5,
    singles: 3,
    doubles: 1,
    triples: 0,
    hr: 1,
    tb: 10,
    bb: 2,
    sf: 0,
    k: 0,
    avg: 0.278,
    obp: 0.35,
    slg: 0.556,
    ops: 0.906,
    ...overrides,
  };
}

// 10 team games -> 15.8 PA needed to qualify for rate stats.
const TEAM_GAMES = 10;

describe('leadersFor', () => {
  it('returns up to five entries sorted by value with ranks 1..5', () => {
    const rows = Array.from({ length: 7 }, (_, index) =>
      row(`p${index}`, `P${index}`, { hr: 7 - index }),
    );
    const result = leadersFor(rows, 'hr', TEAM_GAMES);
    expect(result.map((entry) => entry.value)).toEqual([7, 6, 5, 4, 3]);
    expect(result.map((entry) => entry.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(result.map((entry) => entry.row.name)).toEqual(['P0', 'P1', 'P2', 'P3', 'P4']);
  });

  it('honours a custom limit', () => {
    const rows = Array.from({ length: 5 }, (_, index) => row(`p${index}`, `P${index}`, { hr: 5 - index }));
    expect(leadersFor(rows, 'hr', TEAM_GAMES, 3)).toHaveLength(3);
  });

  it('shares a rank for ties (competition ranking)', () => {
    const rows = [
      row('a', 'Alpha', { hr: 3, pa: 20 }),
      row('b', 'Beta', { hr: 3, pa: 18 }),
      row('c', 'Gamma', { hr: 1, pa: 20 }),
      row('d', 'Delta', { hr: 1, pa: 19 }),
    ];
    expect(leadersFor(rows, 'hr', TEAM_GAMES).map((entry) => entry.rank)).toEqual([1, 1, 3, 3]);
  });

  it('breaks equal-value ties by plate appearances, then name', () => {
    const rows = [
      row('a', 'Alpha', { hr: 2, pa: 18 }),
      row('b', 'Beta', { hr: 2, pa: 25 }),
      row('c', 'Gamma', { hr: 2, pa: 25 }),
    ];
    expect(leadersFor(rows, 'hr', TEAM_GAMES).map((entry) => entry.row.name)).toEqual([
      'Beta',
      'Gamma',
      'Alpha',
    ]);
  });

  it('excludes null rate stats', () => {
    const rows = [
      row('a', 'Alpha', { avg: null, obp: null, slg: null, ops: null }),
      row('b', 'Beta', { avg: 0.3 }),
    ];
    expect(leadersFor(rows, 'avg', TEAM_GAMES).map((entry) => entry.row.name)).toEqual(['Beta']);
  });

  it('excludes unqualified players from rate categories', () => {
    const rows = [
      row('star', 'Star', { avg: 0.25, pa: 20 }),
      row('cup', 'Cup', { avg: 0.4, pa: 4 }), // higher AVG but only 4 PA
    ];
    const result = leadersFor(rows, 'avg', TEAM_GAMES);
    expect(result.map((entry) => entry.row.name)).toEqual(['Star']);
    expect(result[0].value).toBe(0.25);
  });

  it('includes unqualified players in counting categories', () => {
    const rows = [
      row('star', 'Star', { hr: 1, pa: 20 }),
      row('cup', 'Cup', { hr: 5, pa: 4 }),
    ];
    expect(leadersFor(rows, 'hr', TEAM_GAMES).map((entry) => entry.row.name)).toEqual([
      'Cup',
      'Star',
    ]);
  });

  it('returns an empty list when nobody qualifies or there are no rows', () => {
    const unqualified = [row('a', 'Alpha', { avg: 0.4, pa: 1 })];
    expect(leadersFor(unqualified, 'avg', TEAM_GAMES)).toEqual([]);
    expect(leadersFor([], 'bb', TEAM_GAMES)).toEqual([]);
  });
});
