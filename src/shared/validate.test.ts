import { describe, it, expect } from 'vitest';
import { validateData, gameWarnings } from './validate';

const players = {
  players: [
    { id: 'mike-s-1', name: 'Mike S.' },
    { id: 'duke', name: 'Duke' },
    { id: 'jen', name: 'Jen' },
    { id: 'chris', name: 'Chris' },
    { id: 'alex', name: 'Alex' },
    { id: 'sam', name: 'Sam' },
  ],
};

const teams = {
  teams: [
    { id: 'trappers', name: 'Trappers', us: true as const },
    { id: 'eagles', name: 'Eagles' },
    { id: 'royals', name: 'Royals' },
  ],
};

const baseGame = {
  id: '2026-05-12-eagles',
  date: '2026-05-12',
  phase: 'regular' as const,
  opponentId: 'eagles',
  location: 'Doverfield Park',
  score: { us: 7, them: 9 },
  lines: [
    { playerId: 'mike-s-1', ab: 3, '1b': 1, '2b': 1, '3b': 0, hr: 0, bb: 1, sf: 0, k: 1, r: 2 },
    { playerId: 'duke', ab: 3, '1b': 1, '2b': 0, '3b': 0, hr: 1, bb: 0, sf: 0, k: 0, r: 2 },
    { playerId: 'jen', ab: 3, '1b': 0, '2b': 0, '3b': 0, hr: 0, bb: 1, sf: 0, k: 0, r: 1 },
    { playerId: 'chris', ab: 2, '1b': 1, '2b': 0, '3b': 0, hr: 0, bb: 0, sf: 1, k: 0, r: 1 },
    { playerId: 'alex', ab: 3, '1b': 0, '2b': 1, '3b': 0, hr: 0, bb: 0, sf: 0, k: 1, r: 1 },
    { playerId: 'sam', ab: 3, '1b': 1, '2b': 0, '3b': 0, hr: 0, bb: 0, sf: 0, k: 0, r: 0 },
  ],
};

const cleanSeason = {
  season: 2026,
  division: 'B' as const,
  games: [baseGame],
};

const validInput = {
  players,
  teams,
  seasons: { '2026': cleanSeason },
};

describe('validateData', () => {
  it('returns an empty array for a fully valid fixture', () => {
    expect(validateData(validInput)).toEqual([]);
  });

  it('reports an unknown playerId referenced in a game line', () => {
    const invalid = {
      ...validInput,
      seasons: {
        '2026': {
          ...cleanSeason,
          games: [
            {
              ...baseGame,
              lines: [{ ...baseGame.lines[0], playerId: 'nobody' }],
            },
          ],
        },
      },
    };
    expect(validateData(invalid).length).toBeGreaterThan(0);
  });

  it('reports an unknown opponentId', () => {
    const invalid = {
      ...validInput,
      seasons: {
        '2026': {
          ...cleanSeason,
          games: [{ ...baseGame, opponentId: 'ghosts' }],
        },
      },
    };
    expect(validateData(invalid).length).toBeGreaterThan(0);
  });

  it('reports opponentId equal to the us team id', () => {
    const invalid = {
      ...validInput,
      seasons: {
        '2026': {
          ...cleanSeason,
          games: [{ ...baseGame, opponentId: 'trappers' }],
        },
      },
    };
    expect(validateData(invalid).length).toBeGreaterThan(0);
  });

  it('reports an unknown teamId in results.standings', () => {
    const invalid = {
      ...validInput,
      seasons: {
        '2026': {
          ...cleanSeason,
          results: {
            standings: [{ teamId: 'ghosts' }],
            playoffs: [],
          },
        },
      },
    };
    expect(validateData(invalid).length).toBeGreaterThan(0);
  });

  it('reports zero us teams', () => {
    const invalid = {
      ...validInput,
      teams: {
        teams: [
          { id: 'eagles', name: 'Eagles' },
          { id: 'royals', name: 'Royals' },
        ],
      },
    };
    expect(validateData(invalid).length).toBeGreaterThan(0);
  });

  it('reports more than one us team', () => {
    const invalid = {
      ...validInput,
      teams: {
        teams: [
          { id: 'trappers', name: 'Trappers', us: true as const },
          { id: 'eagles', name: 'Eagles', us: true as const },
        ],
      },
    };
    expect(validateData(invalid).length).toBeGreaterThan(0);
  });

  it('reports duplicate player display names', () => {
    const invalid = {
      ...validInput,
      players: {
        players: [
          { id: 'mike-s-1', name: 'Mike S.' },
          { id: 'mike-s-2', name: 'Mike S.' },
        ],
      },
    };
    expect(validateData(invalid).length).toBeGreaterThan(0);
  });

  it('reports a season key that does not match the season field', () => {
    const invalid = {
      ...validInput,
      seasons: {
        '2026': { ...cleanSeason, season: 2027 },
      },
    };
    expect(validateData(invalid).length).toBeGreaterThan(0);
  });
});

describe('gameWarnings', () => {
  it('returns an empty array for a clean game', () => {
    expect(gameWarnings(baseGame)).toEqual([]);
  });

  it('warns when the sum of lines runs does not match score.us', () => {
    const mismatched = {
      ...baseGame,
      lines: baseGame.lines.map((line, index) =>
        index === 0 ? { ...line, r: line.r + 1 } : line,
      ),
    };
    const warnings = gameWarnings(mismatched);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w: string) => w.toLowerCase().includes('run'))).toBe(true);
  });

  it('warns when the team score is exactly twice the sum of line runs', () => {
    const mismatched = { ...baseGame, score: { ...baseGame.score, us: 14 } };
    const warnings = gameWarnings(mismatched);
    expect(warnings.some((w: string) => w.toLowerCase().includes('run'))).toBe(true);
  });

  it('warns when a game has fewer than five lines', () => {
    const short = { ...baseGame, lines: baseGame.lines.slice(0, 4) };
    const warnings = gameWarnings(short);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.some((w: string) => w.toLowerCase().includes('line'))).toBe(true);
  });
});
