import type {
  Game,
  Location,
  Player,
  PlayerLine,
  PlayoffMatchup,
  SeasonFile,
  SeasonResults,
  Standing,
  Team,
} from '../shared/schema';

export function makePlayer(overrides: Partial<Player> = {}): Player {
  return { id: 'p1', name: 'P1', ...overrides };
}

export function makeTeam(overrides: Partial<Team> = {}): Team {
  return { id: 't1', name: 'T1', ...overrides };
}

export function makeLocation(overrides: Partial<Location> = {}): Location {
  return { id: 'loc1', name: 'Field 1', ...overrides };
}

export function makeLine(overrides: Partial<PlayerLine> = {}): PlayerLine {
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

export function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'g1',
    date: '2026-01-01',
    phase: 'regular',
    opponentId: 't2',
    isHome: false,
    score: { us: 0, them: 0 },
    lines: [],
    ...overrides,
  };
}

export function makeStanding(overrides: Partial<Standing> = {}): Standing {
  return { teamId: 't1', ...overrides };
}

export function makePlayoffMatchup(
  overrides: Partial<PlayoffMatchup> = {},
): PlayoffMatchup {
  return { round: 'Final', teamA: 't1', teamB: 't2', ...overrides };
}

export function makeSeason(overrides: Partial<SeasonFile> = {}): SeasonFile {
  return { season: 2026, division: null, games: [], ...overrides };
}

export function makeResults(overrides: Partial<SeasonResults> = {}): SeasonResults {
  return { standings: [], playoffs: [], ...overrides };
}

export interface DemoDataset {
  players: Player[];
  teams: Team[];
  locations: Location[];
  seasons: SeasonFile[];
}

/**
 * Deterministic demo dataset exercising the model's edge cases: home and away
 * games, 9-inning / shortened (6) / extra-inning (10) linescores, games with no
 * innings or no opponentHits, walks and sacrifice flies, and an all-zero line.
 * Linescore innings always sum to each game's score, so `validateData` and
 * `gameWarnings` stay clean.
 */
export function buildDemoDataset(): DemoDataset {
  const players: Player[] = [
    makePlayer({ id: 'z-man', name: 'Z-Man' }),
    makePlayer({ id: 'stretch', name: 'Stretch' }),
    makePlayer({ id: 'duke', name: 'Duke' }),
    makePlayer({ id: 'mike-s', name: 'Mike S.' }),
    makePlayer({ id: 'big-cat', name: 'Big Cat' }),
    makePlayer({ id: 'jo-jo', name: 'Jo Jo' }),
  ];

  const teams: Team[] = [
    makeTeam({ id: 'trappers', name: 'Trappers', us: true }),
    makeTeam({ id: 'hornets', name: 'Hornets' }),
    makeTeam({ id: 'bandits', name: 'Bandits' }),
    makeTeam({ id: 'wildcats', name: 'Wildcats' }),
  ];

  const locations: Location[] = [
    makeLocation({ id: 'doverfield-park', name: 'Doverfield Park' }),
    makeLocation({ id: 'riverbend-field', name: 'Riverbend Field' }),
    makeLocation({ id: 'cedar-grove', name: 'Cedar Grove Park' }),
  ];

  const season2026: SeasonFile = makeSeason({
    season: 2026,
    division: 'B',
    games: [
      // Home, regular, full 9-inning linescore, with opponentHits.
      makeGame({
        id: '2026-05-05-hornets',
        date: '2026-05-05',
        phase: 'regular',
        opponentId: 'hornets',
        isHome: true,
        locationId: 'doverfield-park',
        score: { us: 7, them: 5 },
        opponentHits: 9,
        innings: [
          { us: 1, them: 0 },
          { us: 0, them: 2 },
          { us: 2, them: 0 },
          { us: 0, them: 1 },
          { us: 1, them: 0 },
          { us: 0, them: 0 },
          { us: 3, them: 2 },
          { us: 0, them: 0 },
          { us: 0, them: 0 },
        ],
        lines: [
          makeLine({ playerId: 'z-man', ab: 4, '1b': 2, r: 2 }),
          makeLine({ playerId: 'stretch', ab: 3, '1b': 1, '2b': 1, bb: 1, k: 1, r: 1 }),
          makeLine({ playerId: 'duke', ab: 4, '2b': 1, hr: 1, k: 1, r: 2 }),
          makeLine({ playerId: 'mike-s', ab: 3, '1b': 1, bb: 1, r: 1 }),
          makeLine({ playerId: 'big-cat', ab: 3, sf: 1, k: 1 }),
          makeLine({ playerId: 'jo-jo', ab: 2, '1b': 1, bb: 1, k: 1, r: 1 }),
        ],
      }),
      // Away, round-robin, shortened 6-inning linescore.
      makeGame({
        id: '2026-06-02-bandits',
        date: '2026-06-02',
        phase: 'round_robin',
        opponentId: 'bandits',
        isHome: false,
        locationId: 'riverbend-field',
        score: { us: 5, them: 4 },
        opponentHits: 11,
        innings: [
          { us: 1, them: 0 },
          { us: 0, them: 1 },
          { us: 2, them: 0 },
          { us: 0, them: 2 },
          { us: 1, them: 0 },
          { us: 1, them: 1 },
        ],
        lines: [
          makeLine({ playerId: 'z-man', ab: 3, '1b': 1, bb: 1, r: 1 }),
          makeLine({ playerId: 'stretch', ab: 4, '1b': 1, '3b': 1, k: 1, r: 1 }),
          makeLine({ playerId: 'duke', ab: 3, bb: 1, k: 2, r: 1 }),
          makeLine({ playerId: 'mike-s', ab: 3, '1b': 1, '2b': 1, r: 2 }),
          makeLine({ playerId: 'big-cat', ab: 3, '1b': 1, k: 1 }),
          makeLine({ playerId: 'jo-jo' }), // played, never batted: all zeros
        ],
      }),
      // Home, playoff, extra-inning (10) linescore, no opponentHits.
      makeGame({
        id: '2026-06-23-wildcats',
        date: '2026-06-23',
        phase: 'playoff',
        opponentId: 'wildcats',
        isHome: true,
        locationId: 'doverfield-park',
        score: { us: 6, them: 5 },
        innings: [
          { us: 0, them: 1 },
          { us: 1, them: 0 },
          { us: 0, them: 0 },
          { us: 0, them: 1 },
          { us: 2, them: 0 },
          { us: 0, them: 2 },
          { us: 0, them: 0 },
          { us: 1, them: 0 },
          { us: 0, them: 0 },
          { us: 2, them: 1 },
        ],
        lines: [
          makeLine({ playerId: 'z-man', ab: 4, '1b': 1, '2b': 1, r: 2 }),
          makeLine({ playerId: 'stretch', ab: 3, '1b': 2, sf: 1, r: 1 }),
          makeLine({ playerId: 'duke', ab: 3, hr: 1, bb: 1, r: 1 }),
          makeLine({ playerId: 'mike-s', ab: 3, bb: 1, k: 1 }),
          makeLine({ playerId: 'big-cat', ab: 3, '1b': 1, bb: 1, k: 1, r: 1 }),
          makeLine({ playerId: 'jo-jo', ab: 2, '1b': 1, r: 1 }),
        ],
      }),
      // Away, regular, no innings (only final score + hits).
      makeGame({
        id: '2026-07-14-bandits',
        date: '2026-07-14',
        phase: 'regular',
        opponentId: 'bandits',
        isHome: false,
        locationId: 'cedar-grove',
        score: { us: 3, them: 7 },
        opponentHits: 10,
        lines: [
          makeLine({ playerId: 'z-man', ab: 4, '1b': 1, k: 1, r: 1 }),
          makeLine({ playerId: 'stretch', ab: 3, '1b': 1, k: 2 }),
          makeLine({ playerId: 'duke', ab: 3, '1b': 1, bb: 1, r: 1 }),
          makeLine({ playerId: 'mike-s', ab: 3, k: 1 }),
          makeLine({ playerId: 'big-cat', ab: 3, '1b': 1, r: 1 }),
          makeLine({ playerId: 'jo-jo', ab: 2, k: 1 }),
        ],
      }),
    ],
    results: makeResults({
      standings: [
        makeStanding({ teamId: 'bandits', wins: 10, losses: 2, ties: 0 }),
        makeStanding({ teamId: 'trappers', wins: 9, losses: 3, ties: 0 }),
        makeStanding({ teamId: 'hornets', wins: 5, losses: 7, ties: 0 }),
        makeStanding({ teamId: 'wildcats', wins: 4, losses: 8, ties: 0 }),
      ],
      playoffs: [
        makePlayoffMatchup({
          round: 'Semifinal',
          division: 'B',
          teamA: 'trappers',
          teamB: 'wildcats',
          winner: 'trappers',
          note: 'Won 6-5 (10)',
        }),
        makePlayoffMatchup({
          round: 'Final',
          division: 'B',
          teamA: 'bandits',
          teamB: 'trappers',
          winner: 'bandits',
        }),
      ],
    }),
  });

  const season2025: SeasonFile = makeSeason({
    season: 2025,
    division: 'A',
    games: [
      // Away, regular, no innings and no opponentHits.
      makeGame({
        id: '2025-05-06-wildcats',
        date: '2025-05-06',
        phase: 'regular',
        opponentId: 'wildcats',
        isHome: false,
        locationId: 'riverbend-field',
        score: { us: 8, them: 3 },
        lines: [
          makeLine({ playerId: 'z-man', ab: 4, '1b': 2, r: 2 }),
          makeLine({ playerId: 'stretch', ab: 4, '1b': 1, '2b': 1, k: 1, r: 2 }),
          makeLine({ playerId: 'duke', ab: 3, hr: 1, r: 1 }),
          makeLine({ playerId: 'mike-s', ab: 3, '1b': 1, r: 1 }),
          makeLine({ playerId: 'big-cat', ab: 3, '1b': 1, bb: 1, r: 1 }),
          makeLine({ playerId: 'jo-jo', ab: 3, '1b': 1, r: 1 }),
        ],
      }),
      // Home, round-robin, 7-inning linescore.
      makeGame({
        id: '2025-06-17-bandits',
        date: '2025-06-17',
        phase: 'round_robin',
        opponentId: 'bandits',
        isHome: true,
        locationId: 'doverfield-park',
        score: { us: 4, them: 6 },
        opponentHits: 8,
        innings: [
          { us: 0, them: 2 },
          { us: 1, them: 0 },
          { us: 0, them: 1 },
          { us: 2, them: 0 },
          { us: 0, them: 3 },
          { us: 1, them: 0 },
          { us: 0, them: 0 },
        ],
        lines: [
          makeLine({ playerId: 'z-man', ab: 3, '1b': 1, r: 1 }),
          makeLine({ playerId: 'stretch', ab: 3, '2b': 1 }),
          makeLine({ playerId: 'duke', ab: 3, '1b': 1, k: 1, r: 1 }),
          makeLine({ playerId: 'mike-s', ab: 2, bb: 1 }),
          makeLine({ playerId: 'big-cat', ab: 3, '1b': 1, r: 1 }),
          makeLine({ playerId: 'jo-jo', ab: 3, '1b': 1, k: 1, r: 1 }),
        ],
      }),
      // Away, playoff, no innings and no locationId.
      makeGame({
        id: '2025-07-08-hornets',
        date: '2025-07-08',
        phase: 'playoff',
        opponentId: 'hornets',
        isHome: false,
        score: { us: 2, them: 5 },
        opponentHits: 9,
        lines: [
          makeLine({ playerId: 'z-man', ab: 3, '1b': 1, k: 1 }),
          makeLine({ playerId: 'stretch', ab: 3, hr: 1, r: 1 }),
          makeLine({ playerId: 'duke', ab: 3, k: 2 }),
          makeLine({ playerId: 'mike-s', ab: 2, '1b': 1, r: 1 }),
          makeLine({ playerId: 'big-cat', ab: 3, k: 1 }),
          makeLine({ playerId: 'jo-jo', ab: 3 }),
        ],
      }),
    ],
    results: makeResults({
      standings: [
        makeStanding({ teamId: 'hornets', wins: 9, losses: 7, ties: 0 }),
        makeStanding({ teamId: 'trappers', wins: 8, losses: 8, ties: 0 }),
        makeStanding({ teamId: 'bandits', wins: 7, losses: 9, ties: 0 }),
        makeStanding({ teamId: 'wildcats', wins: 6, losses: 10, ties: 0 }),
      ],
      playoffs: [
        makePlayoffMatchup({
          round: 'Semifinal',
          division: 'A',
          teamA: 'trappers',
          teamB: 'hornets',
          winner: 'hornets',
          note: 'Lost 2-5',
        }),
      ],
    }),
  });

  return {
    players,
    teams,
    locations,
    seasons: [season2026, season2025],
  };
}
