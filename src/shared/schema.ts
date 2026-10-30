import { z } from 'zod';

export type Phase = 'regular' | 'round_robin' | 'playoff';

const nonNegativeIntegerSchema = z.number().int().nonnegative();

export const PlayerSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Player = z.infer<typeof PlayerSchema>;

export const PlayersFileSchema = z.object({
  players: z.array(PlayerSchema),
});
export type PlayersFile = z.infer<typeof PlayersFileSchema>;

export const TeamSchema = z.object({
  id: z.string(),
  name: z.string(),
  us: z.literal(true).optional(),
});
export type Team = z.infer<typeof TeamSchema>;

export const TeamsFileSchema = z.object({
  teams: z.array(TeamSchema),
});
export type TeamsFile = z.infer<typeof TeamsFileSchema>;

export const PlayerLineSchema = z
  .object({
    playerId: z.string(),
    ab: nonNegativeIntegerSchema,
    '1b': nonNegativeIntegerSchema,
    '2b': nonNegativeIntegerSchema,
    '3b': nonNegativeIntegerSchema,
    hr: nonNegativeIntegerSchema,
    bb: nonNegativeIntegerSchema,
    sf: nonNegativeIntegerSchema.default(0),
    k: nonNegativeIntegerSchema,
    r: nonNegativeIntegerSchema,
  })
  .superRefine((line, context) => {
    if (line['1b'] + line['2b'] + line['3b'] + line.hr + line.k > line.ab) {
      context.addIssue({
        code: 'custom',
        message: 'Hits and strikeouts cannot exceed at-bats',
        path: ['ab'],
      });
    }
  });
export type PlayerLine = z.infer<typeof PlayerLineSchema>;

const phaseSchema = z.enum(['regular', 'round_robin', 'playoff']);
const calendarDateSchema = z.string().refine((date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}, 'Date must be a valid calendar date in YYYY-MM-DD format');

export const GameSchema = z
  .object({
    id: z.string(),
    date: calendarDateSchema,
    phase: phaseSchema,
    opponentId: z.string(),
    location: z.string().optional(),
    score: z.object({
      us: nonNegativeIntegerSchema,
      them: nonNegativeIntegerSchema,
    }),
    lines: z.array(PlayerLineSchema),
  })
  .superRefine((game, context) => {
    const playerIds = new Set<string>();
    game.lines.forEach((line, index) => {
      if (playerIds.has(line.playerId)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate playerId "${line.playerId}" in game lines`,
          path: ['lines', index, 'playerId'],
        });
      }
      playerIds.add(line.playerId);
    });
  });
export type Game = z.infer<typeof GameSchema>;

const StandingSchema = z.object({
  teamId: z.string(),
  wins: nonNegativeIntegerSchema.optional(),
  losses: nonNegativeIntegerSchema.optional(),
  ties: nonNegativeIntegerSchema.optional(),
});
export type Standing = z.infer<typeof StandingSchema>;

const PlayoffMatchupSchema = z.object({
  round: z.string(),
  division: z.enum(['A', 'B']).optional(),
  teamA: z.string(),
  teamB: z.string(),
  winner: z.string().optional(),
  note: z.string().optional(),
});
export type PlayoffMatchup = z.infer<typeof PlayoffMatchupSchema>;

export const SeasonResultsSchema = z.object({
  standings: z.array(StandingSchema),
  playoffs: z.array(PlayoffMatchupSchema),
});
export type SeasonResults = z.infer<typeof SeasonResultsSchema>;

export const SeasonFileSchema = z.object({
  season: z.number().int(),
  division: z.enum(['A', 'B']).nullable(),
  games: z.array(GameSchema).superRefine((games, context) => {
    const gameIds = new Set<string>();
    games.forEach((game, index) => {
      if (gameIds.has(game.id)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate game id "${game.id}" within season`,
          path: [index, 'id'],
        });
      }
      gameIds.add(game.id);
    });
  }),
  results: SeasonResultsSchema.optional(),
});
export type SeasonFile = z.infer<typeof SeasonFileSchema>;
