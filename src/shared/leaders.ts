import { isQualified } from './qualification';
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

/** Rate categories are the only ones gated by the qualification rule. */
const RATE_FIELDS = new Set<LeaderField>(['avg', 'ops']);

export interface LeaderEntry {
  /** 1-based competition rank: tied values share a rank (1, 1, 3, ...). */
  rank: number;
  value: number;
  row: LeaderRow;
  /** Set for streak categories whose best run is still alive. */
  active?: boolean;
}

type Rankable = { row: LeaderRow; value: number; active?: boolean };

/** Ranks arbitrary scored rows, shared by the stat and streak categories. */
export function rankEntries(items: Rankable[], limit = 5): LeaderEntry[] {
  const sorted = [...items].sort(
    (a, b) => b.value - a.value || b.row.pa - a.row.pa || a.row.name.localeCompare(b.row.name),
  );

  let currentRank = 0;
  let previousValue: number | null = null;
  const ranked = sorted.map((item, index) => {
    if (item.value !== previousValue) {
      currentRank = index + 1;
      previousValue = item.value;
    }
    return { ...item, rank: currentRank };
  });

  return ranked.slice(0, limit);
}

/**
 * Returns the top `limit` players for one offensive category, highest value
 * first. Rate stats exclude null values and unqualified players; counting
 * stats list everyone. Ties share a rank, and are ordered by plate appearances
 * then name so the result is deterministic.
 */
export function leadersFor(
  rows: LeaderRow[],
  field: LeaderField,
  teamGames: number,
  limit = 5,
): LeaderEntry[] {
  const eligible = rows
    .filter((row) => {
      const value = row[field];
      if (value === null) return false;
      return !RATE_FIELDS.has(field) || isQualified(row, teamGames);
    })
    .map((row) => ({ row, value: row[field] as number }));

  return rankEntries(eligible, limit);
}
