import { describe, it, expect } from 'vitest';
import type {
  Game,
  Player,
  PlayersFile,
  SeasonFile,
  SeasonResults,
  Team,
  TeamsFile,
} from '../../shared/schema';
import {
  applyAddPlayer,
  applyAddTeam,
  applyGameToSeason,
  applyRenamePlayer,
  applyRenameTeam,
  applyResults,
  createSeasonFile,
  slugify,
  suggestGameId,
  suggestPlayerId,
} from './apply';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return { id: 'p-anna', name: 'Anna', ...overrides };
}

function makeTeam(overrides: Partial<Team> = {}): Team {
  return { id: 't-bears', name: 'Bears', ...overrides };
}

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: '2025-06-01-t-bears',
    date: '2025-06-01',
    phase: 'regular',
    opponentId: 't-bears',
    score: { us: 0, them: 0 },
    lines: [],
    ...overrides,
  };
}

function makeSeason(overrides: Partial<SeasonFile> = {}): SeasonFile {
  return { season: 2025, division: null, games: [], ...overrides };
}

function makeResults(overrides: Partial<SeasonResults> = {}): SeasonResults {
  return {
    standings: [{ teamId: 't-bears', wins: 3, losses: 1 }],
    playoffs: [],
    ...overrides,
  };
}

describe('slugify', () => {
  it('lowercases and collapses punctuation/space runs into a dash', () => {
    expect(slugify('Mike S.')).toBe('mike-s');
  });

  it('strips a trailing period and trims surrounding dashes', () => {
    expect(slugify('  Bob   Jones  ')).toBe('bob-jones');
    expect(slugify('A.B.')).toBe('a-b');
  });

  it('turns internal punctuation into dashes', () => {
    expect(slugify("O'Brien")).toBe('o-brien');
    expect(slugify('Jean-Luc Picard')).toBe('jean-luc-picard');
  });

  it('handles an empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('suggestPlayerId', () => {
  it('slugifies a name with no collision', () => {
    expect(suggestPlayerId('Mike S.', [])).toBe('mike-s');
  });

  it('appends -2 on the first collision', () => {
    expect(suggestPlayerId('Mike S.', ['mike-s'])).toBe('mike-s-2');
  });

  it('skips taken suffixes and never reuses an existing id', () => {
    expect(suggestPlayerId('Mike S.', ['mike-s', 'mike-s-2', 'mike-s-4'])).toBe('mike-s-3');
  });

  it('continues the sequence past -3', () => {
    expect(suggestPlayerId('Mike S.', ['mike-s', 'mike-s-2', 'mike-s-3'])).toBe('mike-s-4');
  });
});

describe('suggestGameId', () => {
  it('builds YYYY-MM-DD-<opponentId> with no collision', () => {
    expect(suggestGameId('2025-06-01', 't-bears', [])).toBe('2025-06-01-t-bears');
  });

  it('appends -2 for a doubleheader', () => {
    expect(suggestGameId('2025-06-01', 't-bears', ['2025-06-01-t-bears'])).toBe(
      '2025-06-01-t-bears-2',
    );
  });

  it('skips taken suffixes', () => {
    expect(
      suggestGameId('2025-06-01', 't-bears', [
        '2025-06-01-t-bears',
        '2025-06-01-t-bears-2',
      ]),
    ).toBe('2025-06-01-t-bears-3');
  });
});

describe('createSeasonFile', () => {
  it('returns an empty season for the given year', () => {
    expect(createSeasonFile(2026)).toEqual({ season: 2026, division: null, games: [] });
  });
});

describe('applyGameToSeason', () => {
  it('appends the game and returns a new season object', () => {
    const season = makeSeason();
    const game = makeGame();

    const result = applyGameToSeason(season, game);

    expect(result).toEqual({ ...season, games: [game] });
    expect(result).not.toBe(season);
    expect(result.games).not.toBe(season.games);
    expect(result.games).toHaveLength(1);
  });

  it('appends after existing games without mutating the input', () => {
    const existing = makeGame({ id: '2025-05-01-t-bears' });
    const season = makeSeason({ games: [existing] });
    const before = JSON.parse(JSON.stringify(season)) as SeasonFile;

    const result = applyGameToSeason(season, makeGame());

    expect(season).toEqual(before);
    expect(result.games).toHaveLength(2);
    expect(result.games[0]).toBe(existing);
  });

  it('throws on a duplicate game id', () => {
    const game = makeGame();
    const season = makeSeason({ games: [game] });

    expect(() => applyGameToSeason(season, makeGame())).toThrow('Duplicate game id');
  });
});

describe('applyAddPlayer', () => {
  it('appends a player and returns a new file object', () => {
    const players: PlayersFile = { players: [makePlayer()] };

    const result = applyAddPlayer(players, makePlayer({ id: 'p-ben', name: 'Ben' }));

    expect(result.players).toHaveLength(2);
    expect(result).not.toBe(players);
    expect(result.players).not.toBe(players.players);
  });

  it('does not mutate the input file', () => {
    const players: PlayersFile = { players: [makePlayer()] };
    const before = JSON.parse(JSON.stringify(players)) as PlayersFile;

    applyAddPlayer(players, makePlayer({ id: 'p-ben', name: 'Ben' }));

    expect(players).toEqual(before);
  });

  it('throws on a duplicate player name', () => {
    const players: PlayersFile = { players: [makePlayer({ name: 'Anna' })] };

    expect(() => applyAddPlayer(players, makePlayer({ id: 'p-2', name: 'Anna' }))).toThrow(
      'Duplicate player name',
    );
  });
});

describe('applyRenamePlayer', () => {
  it('renames a player while keeping its id', () => {
    const players: PlayersFile = { players: [makePlayer()] };

    const result = applyRenamePlayer(players, 'p-anna', 'Anna Banana');

    expect(result.players).toHaveLength(1);
    expect(result.players[0]).toEqual({ id: 'p-anna', name: 'Anna Banana' });
    expect(result).not.toBe(players);
  });

  it('leaves other players untouched and does not mutate the input', () => {
    const other = makePlayer({ id: 'p-ben', name: 'Ben' });
    const players: PlayersFile = { players: [makePlayer(), other] };
    const before = JSON.parse(JSON.stringify(players)) as PlayersFile;

    const result = applyRenamePlayer(players, 'p-anna', 'Anna Banana');

    expect(players).toEqual(before);
    expect(result.players[1]).toBe(other);
  });

  it('throws on an unknown player id', () => {
    const players: PlayersFile = { players: [makePlayer()] };

    expect(() => applyRenamePlayer(players, 'p-nobody', 'X')).toThrow('Unknown player id');
  });

  it('throws when renaming to another player name', () => {
    const players: PlayersFile = {
      players: [makePlayer({ name: 'Anna' }), makePlayer({ id: 'p-ben', name: 'Ben' })],
    };

    expect(() => applyRenamePlayer(players, 'p-anna', 'Ben')).toThrow('Duplicate player name');
  });
});

describe('applyAddTeam', () => {
  it('appends a team and returns a new file object', () => {
    const teams: TeamsFile = { teams: [makeTeam()] };

    const result = applyAddTeam(teams, makeTeam({ id: 't-wolves', name: 'Wolves' }));

    expect(result.teams).toHaveLength(2);
    expect(result).not.toBe(teams);
    expect(result.teams).not.toBe(teams.teams);
  });

  it('throws on a duplicate team name', () => {
    const teams: TeamsFile = { teams: [makeTeam({ name: 'Bears' })] };

    expect(() => applyAddTeam(teams, makeTeam({ id: 't-2', name: 'Bears' }))).toThrow(
      'Duplicate team name',
    );
  });
});

describe('applyRenameTeam', () => {
  it('renames a team while keeping its id', () => {
    const teams: TeamsFile = { teams: [makeTeam()] };

    const result = applyRenameTeam(teams, 't-bears', 'Grizzlies');

    expect(result.teams[0]).toEqual({ id: 't-bears', name: 'Grizzlies' });
    expect(result).not.toBe(teams);
  });

  it('throws on an unknown team id', () => {
    const teams: TeamsFile = { teams: [makeTeam()] };

    expect(() => applyRenameTeam(teams, 't-nobody', 'X')).toThrow('Unknown team id');
  });

  it('throws when renaming to another team name', () => {
    const teams: TeamsFile = {
      teams: [makeTeam({ name: 'Bears' }), makeTeam({ id: 't-wolves', name: 'Wolves' })],
    };

    expect(() => applyRenameTeam(teams, 't-bears', 'Wolves')).toThrow('Duplicate team name');
  });
});

describe('applyResults', () => {
  it('replaces the results field and returns a new object', () => {
    const season = makeSeason({ results: makeResults() });
    const results = makeResults({ standings: [{ teamId: 't-bears', wins: 10, losses: 0 }] });

    const result = applyResults(season, results);

    expect(result).not.toBe(season);
    expect(result.results).toBe(results);
    expect(result.games).toBe(season.games);
  });

  it('adds results to a season that had none', () => {
    const season = makeSeason();
    const results = makeResults();

    const result = applyResults(season, results);

    expect(result.results).toEqual(results);
    expect(season.results).toBeUndefined();
  });
});
