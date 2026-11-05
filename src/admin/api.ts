import type {
  Game,
  Player,
  PlayersFile,
  SeasonFile,
  Team,
  TeamsFile,
} from '../shared/schema';

const BASE = '/trappers-stats/__admin';

export interface AdminState {
  players: PlayersFile;
  teams: TeamsFile;
  seasons: SeasonFile[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { issues?: Array<{ path: string; message: string }> }
      | null;
    const message =
      body?.issues?.map((issue) => issue.message).join('; ') ??
      `Request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getState(): Promise<AdminState> {
  return request<AdminState>('/state');
}

export function saveGame(season: number, game: Game): Promise<SeasonFile> {
  return request<SeasonFile>('/save-game', {
    method: 'POST',
    body: JSON.stringify({ season, game }),
  });
}

export function savePlayer(player: Player): Promise<PlayersFile> {
  return request<PlayersFile>('/save-player', {
    method: 'POST',
    body: JSON.stringify({ player }),
  });
}

export function saveTeam(team: Team): Promise<TeamsFile> {
  return request<TeamsFile>('/save-team', {
    method: 'POST',
    body: JSON.stringify({ team }),
  });
}
