import type { ZodError } from 'zod';
import playersJson from '../../data/players.json';
import teamsJson from '../../data/teams.json';
import {
  PlayersFileSchema,
  SeasonFileSchema,
  TeamsFileSchema,
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

// Parse + cross-validate everything at module load, aggregating every issue
// so a bad hand-edit fails `vite build` with the full list at once.
function loadData(): { players: PlayersFile; teams: TeamsFile; seasons: SeasonFile[] } {
  const issues: string[] = [];

  const playersResult = PlayersFileSchema.safeParse(playersJson);
  if (!playersResult.success) {
    issues.push(...formatIssues('players.json', playersResult.error));
  }

  const teamsResult = TeamsFileSchema.safeParse(teamsJson);
  if (!teamsResult.success) {
    issues.push(...formatIssues('teams.json', teamsResult.error));
  }

  const seasonsRecord: Record<string, SeasonFile> = {};
  let seasonsValid = true;
  for (const [path, module] of Object.entries(seasonModules)) {
    const fileName = path.split('/').pop() ?? path;
    const result = SeasonFileSchema.safeParse(module);
    if (result.success) {
      seasonsRecord[fileName.replace(/\.json$/, '')] = result.data;
    } else {
      seasonsValid = false;
      issues.push(...formatIssues(`seasons/${fileName}`, result.error));
    }
  }

  if (playersResult.success && teamsResult.success && seasonsValid) {
    issues.push(
      ...validateData({
        players: playersResult.data,
        teams: teamsResult.data,
        seasons: seasonsRecord,
      }),
    );
  }

  if (issues.length > 0 || !playersResult.success || !teamsResult.success || !seasonsValid) {
    throw new Error(
      `Invalid data files under data/:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`,
    );
  }

  return {
    players: playersResult.data,
    teams: teamsResult.data,
    seasons: Object.values(seasonsRecord).sort((a, b) => a.season - b.season),
  };
}

const data = loadData();

export const players: PlayersFile = data.players;
export const teams: TeamsFile = data.teams;
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

// seasons is sorted ascending by year, so the last entry is the latest.
export function latestSeason(): SeasonFile | undefined {
  return seasons.at(-1);
}
