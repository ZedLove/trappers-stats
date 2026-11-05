import { describe, it, expect } from 'vitest';
import type { PlayerLine, SeasonFile } from './schema';
import {
  type SeasonFilter,
  filterGames,
  leaderboard,
  playerGameLog,
  playerStatsBySeason,
  sortGamesByDate,
  teamRecord,
} from './queries';

function line(overrides: Partial<PlayerLine> = {}): PlayerLine {
  return {
    playerId: 'p-unknown',
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

// Games within each season are deliberately NOT in date order, to prove that
// date-sorting helpers do not depend on file order.
const season2024: SeasonFile = {
  season: 2024,
  division: 'A',
  games: [
    {
      id: 'g-2024-06-05',
      date: '2024-06-05',
      phase: 'regular',
      opponentId: 'opp-a',
      score: { us: 5, them: 3 },
      lines: [
        line({ playerId: 'p-anna', ab: 4, '1b': 2, '2b': 1 }),
        line({ playerId: 'p-ben', ab: 3, '1b': 1 }),
        line({ playerId: 'p-dave', bb: 2 }),
      ],
    },
    {
      id: 'g-2024-05-20',
      date: '2024-05-20',
      phase: 'regular',
      opponentId: 'opp-b',
      score: { us: 2, them: 2 },
      lines: [
        line({ playerId: 'p-anna', ab: 2, '1b': 1 }),
        line({ playerId: 'p-ben', ab: 3, '1b': 1 }),
        line({ playerId: 'p-cleo', ab: 4, '1b': 2 }),
      ],
    },
    {
      id: 'g-2024-06-12',
      date: '2024-06-12',
      phase: 'playoff',
      opponentId: 'opp-a',
      score: { us: 1, them: 4 },
      lines: [
        line({ playerId: 'p-anna', ab: 4, hr: 1 }),
        line({ playerId: 'p-ben', ab: 4, '1b': 2 }),
      ],
    },
  ],
};

const season2025: SeasonFile = {
  season: 2025,
  division: 'B',
  games: [
    {
      id: 'g-2025-05-01',
      date: '2025-05-01',
      phase: 'regular',
      opponentId: 'opp-c',
      score: { us: 7, them: 0 },
      lines: [
        line({ playerId: 'p-anna', ab: 3, '1b': 2, '2b': 1 }),
        line({ playerId: 'p-cleo', ab: 2, '1b': 1 }),
        line({ playerId: 'p-ed', bb: 1 }),
      ],
    },
    {
      id: 'g-2025-04-15',
      date: '2025-04-15',
      phase: 'round_robin',
      opponentId: 'opp-d',
      score: { us: 3, them: 6 },
      lines: [
        line({ playerId: 'p-anna', ab: 1, k: 1 }),
        line({ playerId: 'p-ben', ab: 2, '1b': 1, '2b': 1 }),
      ],
    },
  ],
};

const seasons: SeasonFile[] = [season2024, season2025];

describe('filterGames', () => {
  it('filters by season only, preserving file order', () => {
    const result = filterGames(seasons, { season: 2024, phase: 'all' });

    expect(result.map((entry) => entry.game.id)).toEqual([
      'g-2024-06-05',
      'g-2024-05-20',
      'g-2024-06-12',
    ]);
    expect(result.every((entry) => entry.season === 2024)).toBe(true);
  });

  it('filters by phase across all seasons', () => {
    const filter: SeasonFilter = { season: 'all', phase: 'regular' };
    const result = filterGames(seasons, filter);

    expect(result.map((entry) => entry.game.id)).toEqual([
      'g-2024-06-05',
      'g-2024-05-20',
      'g-2025-05-01',
    ]);
  });

  it("returns every game for 'all' season and 'all' phase", () => {
    const result = filterGames(seasons, { season: 'all', phase: 'all' });

    expect(result).toHaveLength(5);
    expect(result.map((entry) => entry.season)).toEqual([2024, 2024, 2024, 2025, 2025]);
  });

  it('combines season and phase filters', () => {
    const result = filterGames(seasons, { season: 2025, phase: 'round_robin' });

    expect(result).toHaveLength(1);
    expect(result[0]?.season).toBe(2025);
    expect(result[0]?.game.id).toBe('g-2025-04-15');
  });

  it('returns an empty array when no season matches', () => {
    expect(filterGames(seasons, { season: 2099, phase: 'all' })).toEqual([]);
  });

  it('returns an empty array when no game matches the phase', () => {
    expect(filterGames(seasons, { season: 2024, phase: 'round_robin' })).toEqual([]);
  });
});

describe('leaderboard', () => {
  it('sorts by avg descending, breaks ties by pa descending, and puts null avg last', () => {
    const board = leaderboard(seasons, { season: 'all', phase: 'all' });

    expect(board.map((entry) => entry.playerId)).toEqual([
      'p-anna',
      'p-ben',
      'p-cleo',
      'p-dave',
      'p-ed',
    ]);

    // p-ben and p-cleo both hit .500; p-ben has more plate appearances
    expect(board[1]?.stats.avg).toBeCloseTo(0.5, 10);
    expect(board[1]?.stats.pa).toBe(12);
    expect(board[2]?.stats.avg).toBeCloseTo(0.5, 10);
    expect(board[2]?.stats.pa).toBe(6);

    // null averages last, still ordered by pa descending among themselves
    expect(board[3]?.stats.avg).toBeNull();
    expect(board[4]?.stats.avg).toBeNull();
    expect(board[3]?.stats.pa ?? 0).toBeGreaterThan(board[4]?.stats.pa ?? 0);
  });

  it('aggregates stats across the filtered games', () => {
    const board = leaderboard(seasons, { season: 'all', phase: 'all' });
    const anna = board.find((entry) => entry.playerId === 'p-anna');

    expect(anna?.stats).toMatchObject({ g: 5, ab: 14, h: 8, pa: 14 });
    expect(anna?.stats.avg).toBeCloseTo(8 / 14, 10);
  });

  it('respects the season and phase filter', () => {
    const board = leaderboard(seasons, { season: 2024, phase: 'playoff' });

    expect(board.map((entry) => entry.playerId)).toEqual(['p-ben', 'p-anna']);
    expect(board[0]?.stats.avg).toBeCloseTo(0.5, 10);
    expect(board[1]?.stats.avg).toBeCloseTo(0.25, 10);
  });

  it('returns an empty array when the filter matches no games', () => {
    expect(leaderboard(seasons, { season: 2099, phase: 'all' })).toEqual([]);
  });
});

describe('playerGameLog', () => {
  it('returns games date-descending regardless of file order', () => {
    const log = playerGameLog(seasons, 'p-anna');

    expect(log.map((entry) => entry.game.id)).toEqual([
      'g-2025-05-01',
      'g-2025-04-15',
      'g-2024-06-12',
      'g-2024-06-05',
      'g-2024-05-20',
    ]);
    expect(log.map((entry) => entry.season)).toEqual([2025, 2025, 2024, 2024, 2024]);
  });

  it('includes the player line from each game', () => {
    const log = playerGameLog(seasons, 'p-anna');

    expect(log[0]?.line).toEqual(line({ playerId: 'p-anna', ab: 3, '1b': 2, '2b': 1 }));
  });

  it('skips games where the player has no line', () => {
    const log = playerGameLog(seasons, 'p-dave');

    expect(log.map((entry) => entry.game.id)).toEqual(['g-2024-06-05']);
    expect(log[0]?.line).toEqual(line({ playerId: 'p-dave', bb: 2 }));
  });

  it('returns an empty array for an unknown player', () => {
    expect(playerGameLog(seasons, 'p-nobody')).toEqual([]);
  });
});

describe('playerStatsBySeason', () => {
  it('returns one entry per season, season ascending', () => {
    const result = playerStatsBySeason(seasons, 'p-anna');

    expect(result.map((entry) => entry.season)).toEqual([2024, 2025]);
    expect(result[0]?.stats).toMatchObject({ g: 3, ab: 10, h: 5 });
    expect(result[0]?.stats.avg).toBeCloseTo(0.5, 10);
    expect(result[1]?.stats).toMatchObject({ g: 2, ab: 4, h: 3 });
    expect(result[1]?.stats.avg).toBeCloseTo(0.75, 10);
  });

  it('omits seasons in which the player has no lines', () => {
    const result = playerStatsBySeason(seasons, 'p-dave');

    expect(result.map((entry) => entry.season)).toEqual([2024]);
  });

  it('sorts by season even when seasons are not in order', () => {
    const reversed: SeasonFile[] = [season2025, season2024];
    const result = playerStatsBySeason(reversed, 'p-anna');

    expect(result.map((entry) => entry.season)).toEqual([2024, 2025]);
  });

  it('returns an empty array for an unknown player', () => {
    expect(playerStatsBySeason(seasons, 'p-nobody')).toEqual([]);
  });
});

describe('sortGamesByDate', () => {
  it('returns games date-descending', () => {
    const sorted = sortGamesByDate(season2024.games);

    expect(sorted.map((game) => game.id)).toEqual(['g-2024-06-12', 'g-2024-06-05', 'g-2024-05-20']);
  });

  it('does not mutate the input array', () => {
    const games = [...season2024.games];
    const orderBefore = games.map((game) => game.id);

    const sorted = sortGamesByDate(games);

    expect(games.map((game) => game.id)).toEqual(orderBefore);
    expect(sorted).not.toBe(games);
  });

  it('works on any objects with a date field, preserving other fields', () => {
    const items = [
      { date: '2023-12-31', tag: 'a' },
      { date: '2024-01-02', tag: 'b' },
      { date: '2024-01-01', tag: 'c' },
    ];

    const sorted = sortGamesByDate(items);

    expect(sorted.map((item) => item.tag)).toEqual(['b', 'c', 'a']);
  });

  it('returns an empty array for empty input', () => {
    expect(sortGamesByDate([])).toEqual([]);
  });
});

describe('teamRecord', () => {
  it('counts wins, losses, and ties from the score', () => {
    expect(teamRecord(season2024)).toEqual({ w: 1, l: 1, t: 1 });
  });

  it('handles a season with no ties', () => {
    expect(teamRecord(season2025)).toEqual({ w: 1, l: 1, t: 0 });
  });

  it('returns zeros for a season with no games', () => {
    expect(teamRecord({ season: 2099, division: null, games: [] })).toEqual({ w: 0, l: 0, t: 0 });
  });
});
