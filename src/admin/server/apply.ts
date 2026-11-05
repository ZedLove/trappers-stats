import type {
  Game,
  Player,
  PlayersFile,
  SeasonFile,
  SeasonResults,
  Team,
  TeamsFile,
} from '../../shared/schema';

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function nextUniqueId(base: string, existingIds: string[]): string {
  if (!existingIds.includes(base)) return base;
  let suffix = 2;
  while (existingIds.includes(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

export function suggestPlayerId(name: string, existingIds: string[]): string {
  return nextUniqueId(slugify(name), existingIds);
}

export function suggestGameId(
  date: string,
  opponentId: string,
  existingIds: string[],
): string {
  return nextUniqueId(`${date}-${opponentId}`, existingIds);
}

export function createSeasonFile(year: number): SeasonFile {
  return { season: year, division: null, games: [] };
}

export function applyGameToSeason(season: SeasonFile, game: Game): SeasonFile {
  if (season.games.some((existing) => existing.id === game.id)) {
    throw new Error(`Duplicate game id "${game.id}"`);
  }
  return { ...season, games: [...season.games, game] };
}

export function applyAddPlayer(players: PlayersFile, player: Player): PlayersFile {
  if (players.players.some((existing) => existing.name === player.name)) {
    throw new Error(`Duplicate player name "${player.name}"`);
  }
  return { players: [...players.players, player] };
}

export function applyRenamePlayer(
  players: PlayersFile,
  id: string,
  name: string,
): PlayersFile {
  if (!players.players.some((player) => player.id === id)) {
    throw new Error(`Unknown player id "${id}"`);
  }
  if (players.players.some((player) => player.id !== id && player.name === name)) {
    throw new Error(`Duplicate player name "${name}"`);
  }
  return {
    players: players.players.map((player) =>
      player.id === id ? { ...player, name } : player,
    ),
  };
}

export function applyAddTeam(teams: TeamsFile, team: Team): TeamsFile {
  if (teams.teams.some((existing) => existing.name === team.name)) {
    throw new Error(`Duplicate team name "${team.name}"`);
  }
  return { teams: [...teams.teams, team] };
}

export function applyRenameTeam(
  teams: TeamsFile,
  id: string,
  name: string,
): TeamsFile {
  if (!teams.teams.some((team) => team.id === id)) {
    throw new Error(`Unknown team id "${id}"`);
  }
  if (teams.teams.some((team) => team.id !== id && team.name === name)) {
    throw new Error(`Duplicate team name "${name}"`);
  }
  return {
    teams: teams.teams.map((team) => (team.id === id ? { ...team, name } : team)),
  };
}

export function applyResults(season: SeasonFile, results: SeasonResults): SeasonFile {
  return { ...season, results };
}
