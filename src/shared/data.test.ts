import { describe, it, expect } from 'vitest';
import {
  players,
  teams,
  seasons,
  getSeason,
  getPlayer,
  getTeam,
  latestSeason,
} from './data';
import { validateData, gameWarnings } from './validate';

describe('seed data', () => {
  it('passes validateData with no issues', () => {
    const seasonRecord = Object.fromEntries(seasons.map((season) => [String(season.season), season]));
    expect(validateData({ players, teams, seasons: seasonRecord })).toEqual([]);
  });

  it('produces no warnings for any game', () => {
    for (const season of seasons) {
      for (const game of season.games) {
        expect(gameWarnings(game)).toEqual([]);
      }
    }
  });

  it('has unique player ids and display names', () => {
    const ids = players.players.map((player) => player.id);
    const names = players.players.map((player) => player.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it('has exactly one us team', () => {
    expect(teams.teams.filter((team) => team.us === true)).toHaveLength(1);
  });

  describe('2026 season', () => {
    it('exists and is division B', () => {
      const season = getSeason(2026);
      expect(season).toBeDefined();
      expect(season?.division).toBe('B');
    });

    it('has one game per phase', () => {
      const season = getSeason(2026);
      const phases = season?.games.map((game) => game.phase);
      expect(phases).toContain('regular');
      expect(phases).toContain('round_robin');
      expect(phases).toContain('playoff');
      expect(season?.games).toHaveLength(3);
    });

    it('has results with standings and two playoff matchups', () => {
      const season = getSeason(2026);
      expect(season?.results?.standings.length).toBeGreaterThan(0);
      expect(season?.results?.playoffs).toHaveLength(2);
    });

    it('includes one all-zeros player line (played, never batted)', () => {
      const allLines = seasons.flatMap((season) => season.games.flatMap((game) => game.lines));
      const zerosLines = allLines.filter(
        (line) =>
          line.ab === 0 &&
          line['1b'] === 0 &&
          line['2b'] === 0 &&
          line['3b'] === 0 &&
          line.hr === 0 &&
          line.bb === 0 &&
          line.sf === 0 &&
          line.k === 0 &&
          line.r === 0,
      );
      expect(zerosLines).toHaveLength(1);
    });
  });
});

describe('accessors', () => {
  it('getSeason returns the season for a known year', () => {
    expect(getSeason(2026)?.season).toBe(2026);
  });

  it('getSeason returns undefined for an unknown year', () => {
    expect(getSeason(1999)).toBeUndefined();
  });

  it('getPlayer returns a player for a known id', () => {
    const known = players.players[0];
    expect(known).toBeDefined();
    expect(getPlayer(known!.id)).toEqual(known);
  });

  it('getPlayer returns undefined for an unknown id', () => {
    expect(getPlayer('nobody')).toBeUndefined();
  });

  it('getTeam returns a team for a known id', () => {
    const known = teams.teams[0];
    expect(known).toBeDefined();
    expect(getTeam(known!.id)).toEqual(known);
  });

  it('getTeam returns undefined for an unknown id', () => {
    expect(getTeam('nobody')).toBeUndefined();
  });

  it('latestSeason returns the season with the highest year', () => {
    const latest = latestSeason();
    expect(latest).toBeDefined();
    expect(latest?.season).toBe(Math.max(...seasons.map((season) => season.season)));
  });
});
