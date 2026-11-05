import { readFile, readdir } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import { join } from 'node:path';
import type { Connect, Plugin } from 'vite';
import { z } from 'zod';
import {
  GameSchema,
  PlayerSchema,
  PlayersFileSchema,
  SeasonFileSchema,
  SeasonResultsSchema,
  TeamSchema,
  TeamsFileSchema,
  type PlayersFile,
  type SeasonFile,
  type TeamsFile,
} from '../../shared/schema.js';
import {
  applyAddPlayer,
  applyAddTeam,
  applyGameToSeason,
  applyRenamePlayer,
  applyRenameTeam,
  applyResults,
  createSeasonFile,
} from './apply.js';
import { writeJsonAtomic } from './write-json.js';

const SaveGameBodySchema = z.object({ season: z.number().int(), game: GameSchema });
const SavePlayerBodySchema = z.object({ player: PlayerSchema });
const RenamePlayerBodySchema = z.object({ id: z.string(), name: z.string() });
const SaveTeamBodySchema = z.object({ team: TeamSchema });
const RenameTeamBodySchema = z.object({ id: z.string(), name: z.string() });
const SaveResultsBodySchema = z.object({
  season: z.number().int(),
  results: SeasonResultsSchema,
});

function dataPath(...segments: string[]): string {
  return join(process.cwd(), 'data', ...segments);
}

const playersPath = () => dataPath('players.json');
const teamsPath = () => dataPath('teams.json');
const seasonsDir = () => dataPath('seasons');
const seasonPath = (season: number) => dataPath('seasons', `${season}.json`);

async function readPlayers(): Promise<PlayersFile> {
  return PlayersFileSchema.parse(JSON.parse(await readFile(playersPath(), 'utf8')));
}

async function readTeams(): Promise<TeamsFile> {
  return TeamsFileSchema.parse(JSON.parse(await readFile(teamsPath(), 'utf8')));
}

async function readSeason(season: number): Promise<SeasonFile | undefined> {
  try {
    const text = await readFile(seasonPath(season), 'utf8');
    return SeasonFileSchema.parse(JSON.parse(text));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}

async function readAllSeasons(): Promise<SeasonFile[]> {
  const entries = await readdir(seasonsDir());
  const seasons = await Promise.all(
    entries
      .filter((entry) => entry.endsWith('.json'))
      .map(async (entry) => {
        const text = await readFile(join(seasonsDir(), entry), 'utf8');
        return SeasonFileSchema.parse(JSON.parse(text));
      }),
  );
  return seasons.sort((a, b) => a.season - b.season);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function formatIssues(error: z.ZodError): Array<{ path: string; message: string }> {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));
}

function readJsonBody(req: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      body += chunk;
    });
    req.on('end', () => {
      if (body.trim() === '') {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

type AdminHandler = (body: Record<string, unknown>) => Promise<{ status: number; body: unknown }>;

const handlers: Record<string, Record<string, AdminHandler>> = {
  GET: {
    '/state': async () => {
      const [players, teams, seasons] = await Promise.all([
        readPlayers(),
        readTeams(),
        readAllSeasons(),
      ]);
      return { status: 200, body: { players, teams, seasons } };
    },
  },
  POST: {
    '/save-game': async (body) => {
      const { season, game } = SaveGameBodySchema.parse(body);
      const current = (await readSeason(season)) ?? createSeasonFile(season);
      const updated = applyGameToSeason(current, game);
      await writeJsonAtomic(seasonPath(season), updated);
      return { status: 200, body: updated };
    },
    '/save-player': async (body) => {
      const { player } = SavePlayerBodySchema.parse(body);
      const current = await readPlayers();
      const updated = applyAddPlayer(current, player);
      await writeJsonAtomic(playersPath(), updated);
      return { status: 200, body: updated };
    },
    '/rename-player': async (body) => {
      const { id, name } = RenamePlayerBodySchema.parse(body);
      const current = await readPlayers();
      const updated = applyRenamePlayer(current, id, name);
      await writeJsonAtomic(playersPath(), updated);
      return { status: 200, body: updated };
    },
    '/save-team': async (body) => {
      const { team } = SaveTeamBodySchema.parse(body);
      const current = await readTeams();
      const updated = applyAddTeam(current, team);
      await writeJsonAtomic(teamsPath(), updated);
      return { status: 200, body: updated };
    },
    '/rename-team': async (body) => {
      const { id, name } = RenameTeamBodySchema.parse(body);
      const current = await readTeams();
      const updated = applyRenameTeam(current, id, name);
      await writeJsonAtomic(teamsPath(), updated);
      return { status: 200, body: updated };
    },
    '/save-results': async (body) => {
      const { season, results } = SaveResultsBodySchema.parse(body);
      const current = (await readSeason(season)) ?? createSeasonFile(season);
      const updated = applyResults(current, results);
      await writeJsonAtomic(seasonPath(season), updated);
      return { status: 200, body: updated };
    },
  },
};

export default function adminPlugin(): Plugin {
  return {
    name: 'trappers-admin',
    configureServer(server) {
      const route: Connect.NextHandleFunction = async (req, res) => {
        const path = (req.url ?? '/').split('?')[0] ?? '/';
        const method = (req.method ?? 'GET').toUpperCase();

        const handler = handlers[method]?.[path];
        if (!handler) {
          sendJson(res, 404, { issues: [{ path: '', message: 'Not found' }] });
          return;
        }

        try {
          const raw = await readJsonBody(req);
          const result = await handler((raw ?? {}) as Record<string, unknown>);
          sendJson(res, result.status, result.body);
        } catch (error) {
          if (error instanceof z.ZodError) {
            sendJson(res, 400, { issues: formatIssues(error) });
            return;
          }
          sendJson(res, 400, {
            issues: [
              {
                path: '',
                message: error instanceof Error ? error.message : 'Unknown error',
              },
            ],
          });
        }
      };

      // Custom middleware runs before Vite's base middleware strips the base
      // path, so register under the raw path as well as the base-prefixed path.
      server.middlewares.use('/__admin', route);
      const base = server.config.base;
      if (base !== '/') {
        server.middlewares.use(`${base.replace(/\/+$/, '')}/__admin`, route);
      }
    },
  };
}
