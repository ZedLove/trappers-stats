import { describe, it, expect } from 'vitest';
import {
  PlayerSchema,
  PlayersFileSchema,
  TeamSchema,
  TeamsFileSchema,
  PlayerLineSchema,
  GameSchema,
  SeasonResultsSchema,
  SeasonFileSchema,
} from './schema';

const validPlayer = { id: 'mike-s-1', name: 'Mike S.' };
const validPlayersFile = { players: [validPlayer] };

const usTeam = { id: 'trappers', name: 'Trappers', us: true as const };
const opponentTeam = { id: 'eagles', name: 'Eagles' };
const validTeamsFile = { teams: [usTeam, opponentTeam] };

const validLine = {
  playerId: 'mike-s-1',
  ab: 3,
  '1b': 1,
  '2b': 1,
  '3b': 0,
  hr: 0,
  bb: 1,
  sf: 0,
  k: 1,
  r: 2,
};

const validGame = {
  id: '2026-05-12-eagles',
  date: '2026-05-12',
  phase: 'regular' as const,
  opponentId: 'eagles',
  location: 'Doverfield Park',
  score: { us: 14, them: 9 },
  lines: [validLine],
};

const validResults = {
  standings: [
    { teamId: 'eagles', wins: 10, losses: 4, ties: 0 },
    { teamId: 'trappers', wins: 9, losses: 5, ties: 0 },
  ],
  playoffs: [
    {
      round: 'Semifinal',
      division: 'B',
      teamA: 'trappers',
      teamB: 'eagles',
      winner: 'trappers',
      note: '12–7',
    },
  ],
};

const validSeasonFile = {
  season: 2026,
  division: 'B' as const,
  games: [validGame],
  results: validResults,
};

describe('PlayerSchema', () => {
  it('accepts a valid player', () => {
    expect(PlayerSchema.safeParse(validPlayer).success).toBe(true);
  });

  it('rejects a player with a non-string id', () => {
    expect(PlayerSchema.safeParse({ ...validPlayer, id: 1 }).success).toBe(false);
  });

  it('rejects a player with a non-string name', () => {
    expect(PlayerSchema.safeParse({ ...validPlayer, name: null }).success).toBe(false);
  });
});

describe('PlayersFileSchema', () => {
  it('accepts a valid players file', () => {
    expect(PlayersFileSchema.safeParse(validPlayersFile).success).toBe(true);
  });

  it('rejects a players file missing the players array', () => {
    expect(PlayersFileSchema.safeParse({}).success).toBe(false);
  });
});

describe('TeamSchema', () => {
  it('accepts a valid opponent team', () => {
    expect(TeamSchema.safeParse(opponentTeam).success).toBe(true);
  });

  it('accepts a valid us team', () => {
    expect(TeamSchema.safeParse(usTeam).success).toBe(true);
  });

  it('rejects us: false', () => {
    expect(TeamSchema.safeParse({ ...usTeam, us: false }).success).toBe(false);
  });
});

describe('TeamsFileSchema', () => {
  it('accepts a valid teams file', () => {
    expect(TeamsFileSchema.safeParse(validTeamsFile).success).toBe(true);
  });

  it('rejects a teams file missing the teams array', () => {
    expect(TeamsFileSchema.safeParse({}).success).toBe(false);
  });
});

describe('PlayerLineSchema', () => {
  it('accepts a valid line', () => {
    expect(PlayerLineSchema.safeParse(validLine).success).toBe(true);
  });

  it('defaults sf to 0 when omitted', () => {
    const parsed = PlayerLineSchema.safeParse({ ...validLine, sf: undefined });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.sf).toBe(0);
    }
  });

  it('rejects a line whose hits + strikeouts exceed at-bats', () => {
    const invalid = { ...validLine, ab: 2, '1b': 1, '2b': 1, '3b': 0, hr: 0, k: 1 };
    expect(PlayerLineSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects a fractional count', () => {
    expect(PlayerLineSchema.safeParse({ ...validLine, ab: 1.5 }).success).toBe(false);
  });

  it('rejects a negative count', () => {
    expect(PlayerLineSchema.safeParse({ ...validLine, bb: -1 }).success).toBe(false);
  });

  it('rejects a line missing playerId', () => {
    expect(PlayerLineSchema.safeParse({ ...validLine, playerId: undefined }).success).toBe(false);
  });
});

describe('GameSchema', () => {
  it('accepts a valid game', () => {
    expect(GameSchema.safeParse(validGame).success).toBe(true);
  });

  it('rejects duplicate playerId within one game\'s lines', () => {
    const invalid = {
      ...validGame,
      lines: [validLine, { ...validLine }],
    };
    expect(GameSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects duplicate game ids within a season', () => {
    const season = {
      ...validSeasonFile,
      games: [validGame, { ...validGame, lines: [{ ...validLine, playerId: 'duke' }] }],
    };
    expect(SeasonFileSchema.safeParse(season).success).toBe(false);
  });

  it('rejects a non-calendar date', () => {
    expect(GameSchema.safeParse({ ...validGame, date: '2026-02-30' }).success).toBe(false);
  });

  it('rejects an invalid phase', () => {
    expect(GameSchema.safeParse({ ...validGame, phase: 'finals' }).success).toBe(false);
  });

  it('rejects a negative score', () => {
    expect(GameSchema.safeParse({ ...validGame, score: { us: -1, them: 0 } }).success).toBe(false);
  });
});

describe('SeasonResultsSchema', () => {
  it('accepts a valid results block', () => {
    expect(SeasonResultsSchema.safeParse(validResults).success).toBe(true);
  });

  it('accepts optional standings wins/losses/ties omitted', () => {
    const minimal = {
      standings: [{ teamId: 'eagles' }],
      playoffs: [{ round: 'Opening round', teamA: 'trappers', teamB: 'eagles' }],
    };
    expect(SeasonResultsSchema.safeParse(minimal).success).toBe(true);
  });

  it('rejects an unknown division in standings entry', () => {
    expect(SeasonResultsSchema.safeParse({ ...validResults, division: 'C' }).success).toBe(false);
  });
});

describe('SeasonFileSchema', () => {
  it('accepts a valid season file', () => {
    expect(SeasonFileSchema.safeParse(validSeasonFile).success).toBe(true);
  });

  it('accepts division null', () => {
    expect(
      SeasonFileSchema.safeParse({ ...validSeasonFile, division: null }).success,
    ).toBe(true);
  });

  it('rejects an invalid division', () => {
    expect(SeasonFileSchema.safeParse({ ...validSeasonFile, division: 'C' }).success).toBe(false);
  });

  it('rejects a non-integer season', () => {
    expect(SeasonFileSchema.safeParse({ ...validSeasonFile, season: 2026.5 }).success).toBe(false);
  });

  it('accepts a season file without results', () => {
    const withoutResults = {
      season: validSeasonFile.season,
      division: validSeasonFile.division,
      games: validSeasonFile.games,
    };
    expect(SeasonFileSchema.safeParse(withoutResults).success).toBe(true);
  });
});
