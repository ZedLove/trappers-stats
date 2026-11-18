/**
 * MLB-style qualification threshold for rate stats: a player qualifies once
 * they have at least this many plate appearances per game their team played
 * over the period being viewed.
 *
 * This is the single source of truth for the ratio. The denominator comes from
 * the viewed period (e.g. all games in the data for all-time, or just one
 * season's games), so the same rule works as more seasons are added.
 */
export const QUALIFICATION_PA_PER_GAME = 1.58;

/** Minimum plate appearances needed to qualify over `teamGames` games. */
export function minimumQualifyingPa(teamGames: number): number {
  return QUALIFICATION_PA_PER_GAME * teamGames;
}

/** Whether a player has enough plate appearances for the period's game count. */
export function isQualified(player: { pa: number }, teamGames: number): boolean {
  return player.pa >= minimumQualifyingPa(teamGames);
}
