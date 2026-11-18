import { filterGames, type SeasonFilter } from './queries';
import type { PlayerLine, SeasonFile } from './schema';

export type StreakField = 'hit' | 'onbase' | 'nok' | 'xbh';

export interface PlayerStreak {
  playerId: string;
  /** Longest run of consecutive qualifying games. */
  longest: number;
  /** Whether that longest run is still alive at the player's last game. */
  active: boolean;
}

function qualifies(line: PlayerLine, field: StreakField): boolean {
  const hits = line['1b'] + line['2b'] + line['3b'] + line.hr;
  switch (field) {
    case 'hit':
      return hits > 0;
    case 'onbase':
      return hits + line.bb > 0;
    case 'nok':
      return line.k === 0;
    case 'xbh':
      return line['2b'] + line['3b'] + line.hr > 0;
  }
}

/**
 * Longest run of `true` flags. A run is active when it ends at the final flag,
 * so the streak is still alive in the player's most recent game.
 */
export function longestRun(flags: boolean[]): { length: number; active: boolean } {
  let best = 0;
  let bestEndsLast = false;
  let current = 0;

  flags.forEach((flag, index) => {
    current = flag ? current + 1 : 0;
    const isLast = index === flags.length - 1;
    if (current > best) {
      best = current;
      bestEndsLast = isLast;
    } else if (current > 0 && current === best && isLast) {
      bestEndsLast = true;
    }
  });

  return { length: best, active: bestEndsLast };
}

/**
 * Best streak per player for one category over the viewed period. Games are
 * ordered by date across seasons, so an all-time streak carries over from one
 * season to the next. Games a player didn't appear in don't break a streak.
 */
export function streaksFor(
  seasons: SeasonFile[],
  filter: SeasonFilter,
  field: StreakField,
): PlayerStreak[] {
  const appearances = new Map<string, Array<{ gameDate: string; season: number; gameId: string; line: PlayerLine }>>();

  for (const { season, game } of filterGames(seasons, filter)) {
    for (const line of game.lines) {
      const list = appearances.get(line.playerId) ?? [];
      list.push({ gameDate: game.date, season, gameId: game.id, line });
      appearances.set(line.playerId, list);
    }
  }

  return [...appearances.entries()].map(([playerId, games]) => {
    games.sort(
      (a, b) =>
        a.gameDate.localeCompare(b.gameDate) ||
        a.season - b.season ||
        a.gameId.localeCompare(b.gameId),
    );
    const run = longestRun(games.map(({ line }) => qualifies(line, field)));
    return { playerId, longest: run.length, active: run.active };
  });
}
