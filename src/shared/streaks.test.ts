import { describe, expect, it } from 'vitest';
import type { SeasonFilter } from './queries';
import { type SeasonFile } from './schema';
import { makeGame, makeLine, makeSeason } from '../fixtures/fixtures';
import { longestRun, streaksFor } from './streaks';

const ALL_TIME: SeasonFilter = { season: 'all', phase: 'all' };

function season(games: Parameters<typeof makeGame>[0][]): SeasonFile[] {
  return [makeSeason({ season: 2026, division: null, games: games.map(makeGame) })];
}

describe('longestRun', () => {
  it('finds the longest run and reports it active when it ends last', () => {
    expect(longestRun([true, true, false, true])).toEqual({ length: 2, active: false });
    expect(longestRun([true, false, true, true])).toEqual({ length: 2, active: true });
  });

  it('treats the final run as active even when an earlier run tied it', () => {
    expect(longestRun([true, true, false, true, true])).toEqual({ length: 2, active: true });
  });

  it('returns zero for no qualifying games', () => {
    expect(longestRun([])).toEqual({ length: 0, active: false });
    expect(longestRun([false, false])).toEqual({ length: 0, active: false });
  });
});

describe('streaksFor', () => {
  const seasons = season([
    {
      id: 'g1',
      date: '2026-05-01',
      lines: [
        makeLine({ playerId: 'a', '1b': 1 }),
        makeLine({ playerId: 'b', bb: 1, k: 2 }),
      ],
    },
    {
      id: 'g2',
      date: '2026-05-02',
      lines: [
        makeLine({ playerId: 'a', '1b': 1, '2b': 1 }),
        makeLine({ playerId: 'b', bb: 1, k: 1 }),
      ],
    },
    {
      id: 'g3',
      date: '2026-05-03',
      lines: [
        makeLine({ playerId: 'a', ab: 3, k: 1 }), // hitless
        makeLine({ playerId: 'b', ab: 3, k: 0, hr: 1 }),
      ],
    },
  ]);

  it('computes hit streaks', () => {
    const result = streaksFor(seasons, ALL_TIME, 'hit');
    expect(result.find((entry) => entry.playerId === 'a')).toMatchObject({
      longest: 2,
      active: false,
    });
    expect(result.find((entry) => entry.playerId === 'b')).toMatchObject({
      longest: 1,
      active: true,
    });
  });

  it('counts a walk as on-base but not as a hit', () => {
    const onBase = streaksFor(seasons, ALL_TIME, 'onbase');
    expect(onBase.find((entry) => entry.playerId === 'b')).toMatchObject({
      longest: 3,
      active: true,
    });
  });

  it('computes strikeout-less streaks', () => {
    const noK = streaksFor(seasons, ALL_TIME, 'nok');
    expect(noK.find((entry) => entry.playerId === 'a')).toMatchObject({
      longest: 2,
      active: false,
    });
    // b struck out in the first two games, then went K-free in the last.
    expect(noK.find((entry) => entry.playerId === 'b')).toMatchObject({
      longest: 1,
      active: true,
    });
  });

  it('computes extra-base streaks', () => {
    const xbh = streaksFor(seasons, ALL_TIME, 'xbh');
    expect(xbh.find((entry) => entry.playerId === 'a')).toMatchObject({
      longest: 1,
      active: false,
    });
    expect(xbh.find((entry) => entry.playerId === 'b')).toMatchObject({
      longest: 1,
      active: true,
    });
  });

  it('carries a streak across seasons when viewing all-time', () => {
    const across = [
      makeSeason({
        season: 2025,
        division: null,
        games: [
          makeGame({
            id: 'old',
            date: '2025-09-30',
            lines: [makeLine({ playerId: 'c', '1b': 1 })],
          }),
        ],
      }),
      makeSeason({
        season: 2026,
        division: null,
        games: [
          makeGame({
            id: 'new',
            date: '2026-04-01',
            lines: [makeLine({ playerId: 'c', '1b': 1 })],
          }),
        ],
      }),
    ];
    expect(streaksFor(across, ALL_TIME, 'hit').find((entry) => entry.playerId === 'c')).toMatchObject({
      longest: 2,
      active: true,
    });
  });

  it('respects the period filter', () => {
    expect(
      streaksFor(seasons, { season: 2026, phase: 'playoff' }, 'hit'),
    ).toEqual([]);
  });
});
