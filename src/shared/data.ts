import type { ZodError } from 'zod';
import locationsJson from '../../data/locations.json';
import playersJson from '../../data/players.json';
import teamsJson from '../../data/teams.json';
import { buildDemoDataset } from '../fixtures/fixtures';
import {
  LocationsFileSchema,
  PlayersFileSchema,
  SeasonFileSchema,
  TeamsFileSchema,
  type Location,
  type LocationsFile,
  type Player,
  type PlayersFile,
  type SeasonFile,
  type Team,
  type TeamsFile,
} from './schema';
import { validateData } from './validate';

const seasonModules = import.meta.glob('../../data/seasons/*.json', {
  eager: true,
  import: 'default',
});

function formatIssues(label: string, error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${label}: ${path}: ${issue.message}`;
  });
}

interface RawData {
  players: unknown;
  teams: unknown;
  locations: unknown;
  seasons: Record<string, unknown>;
}

interface LoadedData {
  players: PlayersFile;
  teams: TeamsFile;
  locations: LocationsFile;
  seasons: SeasonFile[];
}

// Parse + cross-validate everything, aggregating every issue so a bad hand-edit
// fails `vite build` with the full list at once. Shared by the real-data and
// demo-data sources so both pass through the exact same validation path.
function validateAndLoad(raw: RawData): LoadedData {
  const issues: string[] = [];

  const playersResult = PlayersFileSchema.safeParse(raw.players);
  if (!playersResult.success) {
    issues.push(...formatIssues('players.json', playersResult.error));
  }

  const teamsResult = TeamsFileSchema.safeParse(raw.teams);
  if (!teamsResult.success) {
    issues.push(...formatIssues('teams.json', teamsResult.error));
  }

  const locationsResult = LocationsFileSchema.safeParse(raw.locations);
  if (!locationsResult.success) {
    issues.push(...formatIssues('locations.json', locationsResult.error));
  }

  const seasonsRecord: Record<string, SeasonFile> = {};
  let seasonsValid = true;
  for (const [seasonKey, module] of Object.entries(raw.seasons)) {
    const fileName = `${seasonKey}.json`;
    const result = SeasonFileSchema.safeParse(module);
    if (result.success) {
      seasonsRecord[seasonKey] = result.data;
    } else {
      seasonsValid = false;
      issues.push(...formatIssues(`seasons/${fileName}`, result.error));
    }
  }

  if (playersResult.success && teamsResult.success && locationsResult.success && seasonsValid) {
    issues.push(
      ...validateData({
        players: playersResult.data,
        teams: teamsResult.data,
        locations: locationsResult.data,
        seasons: seasonsRecord,
      }),
    );
  }

  if (
    issues.length > 0 ||
    !playersResult.success ||
    !teamsResult.success ||
    !locationsResult.success ||
    !seasonsValid
  ) {
    throw new Error(
      `Invalid data files under data/:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`,
    );
  }

  return {
    players: playersResult.data,
    teams: teamsResult.data,
    locations: locationsResult.data,
    seasons: Object.values(seasonsRecord).sort((a, b) => a.season - b.season),
  };
}

// Real data: the hand-edited JSON files under `data/` plus one file per season.
function realSource(): RawData {
  const seasons: Record<string, unknown> = {};
  for (const [path, module] of Object.entries(seasonModules)) {
    const fileName = path.split('/').pop() ?? path;
    seasons[fileName.replace(/\.json$/, '')] = module;
  }
  return {
    players: playersJson,
    teams: teamsJson,
    locations: locationsJson,
    seasons,
  };
}

// Demo data: the deterministic fixture-generated dataset, wrapped into the same
// file shapes the real source produces.
function demoSource(): RawData {
  const dataset = buildDemoDataset();
  return {
    players: { players: dataset.players },
    teams: { teams: dataset.teams },
    locations: { locations: dataset.locations },
    seasons: Object.fromEntries(dataset.seasons.map((season) => [String(season.season), season])),
  };
}

// `import.meta.env.DEV` is statically `false` in production builds, so the demo
// branch (and the `buildDemoDataset` import feeding it) is dead code there and
// gets tree-shaken out of the shipped bundle. Keep this on the compile-time env
// flag, not a runtime one.
const useDemoData = import.meta.env.DEV && import.meta.env.VITE_DEMO_DATA === 'true';

const data = validateAndLoad(useDemoData ? demoSource() : realSource());

export const players: PlayersFile = data.players;
export const teams: TeamsFile = data.teams;
export const locations: LocationsFile = data.locations;
export const seasons: SeasonFile[] = data.seasons;

export function getSeason(year: number): SeasonFile | undefined {
  return seasons.find((season) => season.season === year);
}

export function getPlayer(id: string): Player | undefined {
  return players.players.find((player) => player.id === id);
}

export function getTeam(id: string): Team | undefined {
  return teams.teams.find((team) => team.id === id);
}

/** Display name of the "us" team, falling back to "Trappers" if unset. */
export function getUsTeamName(): string {
  return teams.teams.find((team) => team.us === true)?.name ?? 'Trappers';
}

export function getLocation(id: string | undefined): Location | undefined {
  return locations.locations.find((location) => location.id === id);
}

// seasons is sorted ascending by year, so the last entry is the latest.
export function latestSeason(): SeasonFile | undefined {
  return seasons.at(-1);
}
