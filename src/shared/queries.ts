import type { Game, Phase, PlayerLine, SeasonFile } from './schema';
import { type DerivedStats, deriveStats, sumLines } from './stats';

export type SeasonFilter = {
  season: number | 'all';
  phase: 'all' | Phase;
};

// Date strings are YYYY-MM-DD, so lexical comparison is chronological comparison.
function compareDatesDescending(a: string, b: string): number {
  return a < b ? 1 : a > b ? -1 : 0;
}

export function filterGames(
  seasons: SeasonFile[],
  filter: SeasonFilter,
): Array<{ season: number; game: Game }> {
  const result: Array<{ season: number; game: Game }> = [];
  for (const seasonFile of seasons) {
    if (filter.season !== 'all' && seasonFile.season !== filter.season) {
      continue;
    }
    for (const game of seasonFile.games) {
      if (filter.phase !== 'all' && game.phase !== filter.phase) {
        continue;
      }
      result.push({ season: seasonFile.season, game });
    }
  }
  return result;
}

export function leaderboard(
  seasons: SeasonFile[],
  filter: SeasonFilter,
): Array<{ playerId: string; stats: DerivedStats }> {
  const linesByPlayer = new Map<string, PlayerLine[]>();
  for (const { game } of filterGames(seasons, filter)) {
    for (const line of game.lines) {
      const existing = linesByPlayer.get(line.playerId);
      if (existing) {
        existing.push(line);
      } else {
        linesByPlayer.set(line.playerId, [line]);
      }
    }
  }

  return [...linesByPlayer.entries()]
    .map(([playerId, lines]) => ({ playerId, stats: deriveStats(sumLines(lines)) }))
    .sort(compareLeaderboardEntries);
}

function compareLeaderboardEntries(
  a: { stats: DerivedStats },
  b: { stats: DerivedStats },
): number {
  const avgA = a.stats.avg;
  const avgB = b.stats.avg;
  if (avgA === null && avgB !== null) return 1;
  if (avgA !== null && avgB === null) return -1;
  if (avgA !== null && avgB !== null && avgA !== avgB) return avgB - avgA;
  return b.stats.pa - a.stats.pa;
}

export function playerGameLog(
  seasons: SeasonFile[],
  playerId: string,
): Array<{ season: number; game: Game; line: PlayerLine }> {
  const entries: Array<{ season: number; game: Game; line: PlayerLine }> = [];
  for (const seasonFile of seasons) {
    for (const game of seasonFile.games) {
      const line = game.lines.find((candidate) => candidate.playerId === playerId);
      if (line) {
        entries.push({ season: seasonFile.season, game, line });
      }
    }
  }
  return entries.sort((a, b) => compareDatesDescending(a.game.date, b.game.date));
}

export function playerStatsBySeason(
  seasons: SeasonFile[],
  playerId: string,
): Array<{ season: number; stats: DerivedStats }> {
  return seasons
    .map((seasonFile) => ({
      season: seasonFile.season,
      lines: seasonFile.games.flatMap((game) =>
        game.lines.filter((line) => line.playerId === playerId),
      ),
    }))
    .filter((entry) => entry.lines.length > 0)
    .sort((a, b) => a.season - b.season)
    .map((entry) => ({ season: entry.season, stats: deriveStats(sumLines(entry.lines)) }));
}

export function sortGamesByDate<T extends { date: string }>(games: T[]): T[] {
  return [...games].sort((a, b) => compareDatesDescending(a.date, b.date));
}

export function teamRecord(season: SeasonFile): { w: number; l: number; t: number } {
  let w = 0;
  let l = 0;
  let t = 0;
  for (const game of season.games) {
    if (game.score.us > game.score.them) {
      w += 1;
    } else if (game.score.us < game.score.them) {
      l += 1;
    } else {
      t += 1;
    }
  }
  return { w, l, t };
}
