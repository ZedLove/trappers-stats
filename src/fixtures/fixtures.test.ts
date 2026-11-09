import { describe, expect, it } from 'vitest';
import {
  GameSchema,
  LocationSchema,
  PlayerLineSchema,
  PlayerSchema,
  SeasonFileSchema,
  SeasonResultsSchema,
  TeamSchema,
} from '../shared/schema';
import { gameWarnings, validateData } from '../shared/validate';
import {
  buildDemoDataset,
  makeGame,
  makeLine,
  makeLocation,
  makePlayoffMatchup,
  makePlayer,
  makeResults,
  makeSeason,
  makeStanding,
  makeTeam,
} from './fixtures';

describe('fixtures builders', () => {
  it('makePlayer: default and override are schema-valid', () => {
    expect(PlayerSchema.safeParse(makePlayer()).success).toBe(true);
    expect(PlayerSchema.safeParse(makePlayer({ id: 'z-man', name: 'Z-Man' })).success).toBe(
      true,
    );
  });

  it('makeTeam: default and override are schema-valid', () => {
    expect(TeamSchema.safeParse(makeTeam()).success).toBe(true);
    expect(
      TeamSchema.safeParse(makeTeam({ id: 'trappers', name: 'Trappers', us: true })).success,
    ).toBe(true);
  });

  it('makeLocation: default and override are schema-valid', () => {
    expect(LocationSchema.safeParse(makeLocation()).success).toBe(true);
    expect(
      LocationSchema.safeParse(makeLocation({ id: 'doverfield-park', name: 'Doverfield Park' }))
        .success,
    ).toBe(true);
  });

  it('makeLine: default and override are schema-valid', () => {
    expect(PlayerLineSchema.safeParse(makeLine()).success).toBe(true);
    expect(
      PlayerLineSchema.safeParse(
        makeLine({ ab: 3, '1b': 1, '2b': 1, bb: 1, sf: 1, k: 1, r: 2 }),
      ).success,
    ).toBe(true);
  });

  it('makeGame: default and override are schema-valid', () => {
    expect(GameSchema.safeParse(makeGame()).success).toBe(true);
    expect(
      GameSchema.safeParse(
        makeGame({
          id: 'g2',
          date: '2026-06-02',
          phase: 'playoff',
          opponentId: 't9',
          isHome: true,
          score: { us: 5, them: 3 },
          lines: [makeLine()],
        }),
      ).success,
    ).toBe(true);
  });

  it('makeStanding: default and override are schema-valid', () => {
    expect(SeasonResultsSchema.safeParse({ standings: [makeStanding()], playoffs: [] }).success).toBe(
      true,
    );
    expect(
      SeasonResultsSchema.safeParse({
        standings: [makeStanding({ teamId: 't2', wins: 3, losses: 1, ties: 0 })],
        playoffs: [],
      }).success,
    ).toBe(true);
  });

  it('makePlayoffMatchup: default and override are schema-valid', () => {
    expect(SeasonResultsSchema.safeParse({ standings: [], playoffs: [makePlayoffMatchup()] }).success).toBe(
      true,
    );
    expect(
      SeasonResultsSchema.safeParse({
        standings: [],
        playoffs: [
          makePlayoffMatchup({
            round: 'Semifinal',
            division: 'B',
            teamA: 't1',
            teamB: 't2',
            winner: 't1',
            note: '12-7',
          }),
        ],
      }).success,
    ).toBe(true);
  });

  it('makeSeason: default and override are schema-valid', () => {
    expect(SeasonFileSchema.safeParse(makeSeason()).success).toBe(true);
    expect(
      SeasonFileSchema.safeParse(
        makeSeason({ season: 2025, division: 'A', games: [makeGame()] }),
      ).success,
    ).toBe(true);
  });

  it('makeResults: default and override are schema-valid', () => {
    expect(SeasonResultsSchema.safeParse(makeResults()).success).toBe(true);
    expect(
      SeasonResultsSchema.safeParse(
        makeResults({ standings: [makeStanding()], playoffs: [makePlayoffMatchup()] }),
      ).success,
    ).toBe(true);
  });
});

describe('buildDemoDataset', () => {
  const dataset = buildDemoDataset();

  it('produces players, teams, and locations that all pass their schemas', () => {
    for (const player of dataset.players) {
      expect(PlayerSchema.safeParse(player).success).toBe(true);
    }
    for (const team of dataset.teams) {
      expect(TeamSchema.safeParse(team).success).toBe(true);
    }
    for (const location of dataset.locations) {
      expect(LocationSchema.safeParse(location).success).toBe(true);
    }
  });

  it('produces seasons that all pass SeasonFileSchema', () => {
    expect(dataset.seasons.length).toBeGreaterThanOrEqual(2);
    for (const season of dataset.seasons) {
      expect(SeasonFileSchema.safeParse(season).success).toBe(true);
    }
  });

  it('keeps every linescore innings sum consistent with its score', () => {
    for (const season of dataset.seasons) {
      for (const game of season.games) {
        if (!game.innings) continue;
        const us = game.innings.reduce((total, inning) => total + inning.us, 0);
        const them = game.innings.reduce((total, inning) => total + inning.them, 0);
        expect(us).toBe(game.score.us);
        expect(them).toBe(game.score.them);
      }
    }
  });

  it('is clean under validateData and gameWarnings', () => {
    expect(
      validateData({
        players: { players: dataset.players },
        teams: { teams: dataset.teams },
        locations: { locations: dataset.locations },
        seasons: Object.fromEntries(dataset.seasons.map((s) => [String(s.season), s])),
      }),
    ).toEqual([]);
    for (const season of dataset.seasons) {
      for (const game of season.games) {
        expect(gameWarnings(game)).toEqual([]);
      }
    }
  });
});
