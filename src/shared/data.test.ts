import { describe, it, expect } from 'vitest';
import {
  players,
  teams,
  locations,
  seasons,
  getSeason,
  getPlayer,
  getTeam,
  getLocation,
  latestSeason,
} from './data';
import { validateData, gameWarnings } from './validate';

describe('seed data', () => {
  it('passes validateData with no issues', () => {
    const seasonRecord = Object.fromEntries(seasons.map((season) => [String(season.season), season]));
    expect(validateData({ players, teams, locations, seasons: seasonRecord })).toEqual([]);
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

  it('has unique location ids and names', () => {
    const ids = locations.locations.map((location) => location.id);
    const names = locations.locations.map((location) => location.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it('has exactly one us team', () => {
    expect(teams.teams.filter((team) => team.us === true)).toHaveLength(1);
  });
});

describe('accessors', () => {
  it('getSeason returns the season for a known year', () => {
    expect(getSeason(2026)?.season).toBe(2026);
  });

  it('getSeason returns undefined for an unknown year', () => {
    expect(getSeason(1999)).toBeUndefined();
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

  it('getLocation returns undefined for an unknown id', () => {
    expect(getLocation('nobody')).toBeUndefined();
  });

  it('latestSeason returns the season with the highest year', () => {
    const latest = latestSeason();
    expect(latest).toBeDefined();
    expect(latest?.season).toBe(Math.max(...seasons.map((season) => season.season)));
  });
});
