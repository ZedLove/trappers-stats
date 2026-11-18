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
  const eligible = rows.filter((row) => {
    const value = row[field];
    if (value === null) return false;
    return !RATE_FIELDS.has(field) || isQualified(row, teamGames);
  });

  const sorted = [...eligible].sort((a, b) => {
    const difference = (b[field] as number) - (a[field] as number);
    return difference || b.pa - a.pa || a.name.localeCompare(b.name);
  });

  let currentRank = 0;
  let previousValue: number | null = null;
  const ranked = sorted.map((row, index) => {
    const value = row[field] as number;
    if (value !== previousValue) {
      currentRank = index + 1;
      previousValue = value;
    }
    return { rank: currentRank, value, row };
  });

  return ranked.slice(0, limit);
}
