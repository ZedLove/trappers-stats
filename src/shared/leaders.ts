import type { DerivedStats } from './stats';

/** The offensive categories shown on the leaders page. */
export type LeaderField =
  | 'avg'
  | 'ops'
  | 'hr'
  | 'singles'
  | 'doubles'
  | 'triples'
  | 'bb';

/** A leaderboard row with the player's display name resolved. */
export type LeaderRow = { playerId: string; name: string } & DerivedStats;

export interface LeaderResult {
  /** The top qualifying value, or null when nobody qualifies. */
  value: number | null;
  /** Everyone tied at the top value (empty when there is nothing to rank). */
  leaders: LeaderRow[];
}

/**
 * Finds the leader(s) for one offensive category. Rate stats with no qualifying
 * plate appearances (null) are excluded; ties all make the podium.
 */
export function leadersFor(rows: LeaderRow[], field: LeaderField): LeaderResult {
  const ranked = rows.filter((row) => row[field] !== null);
  if (ranked.length === 0) {
    return { value: null, leaders: [] };
  }

  const value = Math.max(...ranked.map((row) => row[field] as number));
  return {
    value,
    leaders: ranked.filter((row) => row[field] === value),
  };
}
