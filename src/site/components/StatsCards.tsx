import { useMemo, useState } from 'react';
import { Box, Chip, IconButton, Link as MuiLink, Paper, Typography } from '@mui/material';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { formatRate, type DerivedStats } from '../../shared/stats';

// The resolved row handed to cards (and the DataGrid) after StatsGrid maps
// each playerId to a display name. Stats stay flat so the DataGrid columns can
// read them directly and the cards can too.
export type PlayerStatRow = { playerId: string; name: string } & DerivedStats;

export interface StatsCardsProps {
  /** Rows in the AVG-desc leaderboard order; each card is ranked by index. */
  rows: PlayerStatRow[];
}

type SortField =
  | 'g'
  | 'pa'
  | 'ab'
  | 'r'
  | 'h'
  | 'singles'
  | 'doubles'
  | 'triples'
  | 'hr'
  | 'bb'
  | 'sf'
  | 'k'
  | 'avg'
  | 'obp'
  | 'slg'
  | 'ops';

type SortDir = 'asc' | 'desc';

const SORT_CHIPS: Array<{ field: SortField; label: string }> = [
  { field: 'g', label: 'G' },
  { field: 'avg', label: 'AVG' },
  { field: 'obp', label: 'OBP' },
  { field: 'slg', label: 'SLG' },
  { field: 'ops', label: 'OPS' },
  { field: 'h', label: 'H' },
  { field: 'hr', label: 'HR' },
  { field: 'r', label: 'R' },
  { field: 'bb', label: 'BB' },
  { field: 'k', label: 'SO' },
  { field: 'pa', label: 'PA' },
  { field: 'ab', label: 'AB' },
];

function sortRows(rows: PlayerStatRow[], field: SortField, dir: SortDir): PlayerStatRow[] {
  return [...rows].sort((a, b) => {
    const av = (a[field] as number | null) ?? null;
    const bv = (b[field] as number | null) ?? null;
    // Undefined rates always sort last, regardless of direction.
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    return dir === 'asc' ? av - bv : bv - av;
  });
}

interface StatProps {
  label: string;
  value: string;
  /** Stable key used to tag the value for tests (`stat-<field>`). */
  field: string;
  /** AVG is the visual headline of the card. */
  emphasized?: boolean;
}

function Stat({ label, value, field, emphasized = false }: StatProps) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.25,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.4 }}>
        {label}
      </Typography>
      <Typography
        data-testid={`stat-${field}`}
        variant={emphasized ? 'h6' : 'body1'}
        sx={{
          fontWeight: emphasized ? 700 : 500,
          color: emphasized ? 'secondary.main' : 'text.primary',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <Box
      data-testid="rank-badge"
      sx={{
        flexShrink: 0,
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        fontWeight: 700,
        fontSize: 14,
        lineHeight: 1,
      }}
    >
      {rank}
    </Box>
  );
}

// The detail stats revealed when a card is expanded. Counting stats render as
// raw integers, matching the headline row. `field` indexes into the row.
const DETAIL_STATS = [
  { label: 'PA', field: 'pa' },
  { label: 'AB', field: 'ab' },
  { label: 'R', field: 'r' },
  { label: 'H', field: 'h' },
  { label: '1B', field: 'singles' },
  { label: '2B', field: 'doubles' },
  { label: '3B', field: 'triples' },
  { label: 'HR', field: 'hr' },
  { label: 'BB', field: 'bb' },
  { label: 'SO', field: 'k' },
] as const;

/**
 * Phone-width leaderboard: a sort-chip row plus a vertical list of compact
 * player cards, one per player. Tapping a chip sorts by that stat; tapping the
 * active chip flips direction. Each card leads with a rank badge and the
 * player's name linking to their page, followed by a compact
 * G / AVG / OBP / SLG / OPS row with AVG as the headline. A chevron button
 * expands the card into a full counting-stat grid; expanding one card collapses
 * the previously-expanded one (accordion).
 */
export default function StatsCards({ rows }: StatsCardsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('avg');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sortedRows = useMemo(() => sortRows(rows, sortField, sortDir), [rows, sortField, sortDir]);

  function handleSortChange(field: SortField) {
    if (field === sortField) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {SORT_CHIPS.map((chip) => {
          const active = sortField === chip.field;
          return (
            <Chip
              key={chip.field}
              label={active ? `${chip.label} ${sortDir === 'asc' ? '▲' : '▼'}` : chip.label}
              size="small"
              color={active ? 'primary' : 'default'}
              variant={active ? 'filled' : 'outlined'}
              aria-pressed={active}
              onClick={() => handleSortChange(chip.field)}
            />
          );
        })}
      </Box>
      <Box
        component="ol"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          m: 0,
          p: 0,
          listStyle: 'none',
        }}
      >
        {sortedRows.map((row, index) => {
          const expanded = expandedId === row.playerId;
          return (
            <Paper
              key={row.playerId}
              component="li"
              variant="outlined"
              sx={{ px: 1.5, py: 1.25, display: 'flex', flexDirection: 'column', gap: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                <RankBadge rank={index + 1} />
                <MuiLink
                  component={RouterLink}
                  to={`/players/${row.playerId}`}
                  color="secondary"
                  variant="subtitle1"
                  underline="hover"
                  sx={{ fontWeight: 600, minWidth: 0 }}
                >
                  {row.name}
                </MuiLink>
                <IconButton
                  size="small"
                  onClick={() => setExpandedId(expanded ? null : row.playerId)}
                  aria-expanded={expanded}
                  aria-label={`${expanded ? 'Hide' : 'Show'} all stats for ${row.name}`}
                  sx={{ ml: 'auto', flexShrink: 0 }}
                >
                  {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </IconButton>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Stat label="G" field="g" value={String(row.g)} />
                <Stat label="AVG" field="avg" value={formatRate(row.avg)} emphasized />
                <Stat label="OBP" field="obp" value={formatRate(row.obp)} />
                <Stat label="SLG" field="slg" value={formatRate(row.slg)} />
                <Stat label="OPS" field="ops" value={formatRate(row.ops)} />
              </Box>
              {expanded && (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))',
                    gap: 1,
                    pt: 0.5,
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  {DETAIL_STATS.map(({ label, field }) => (
                    <Stat key={field} label={label} field={field} value={String(row[field])} />
                  ))}
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
