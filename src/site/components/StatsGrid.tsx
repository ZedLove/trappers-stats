import { useMemo, useState } from 'react';
import { Box, Link as MuiLink, TextField, Typography } from '@mui/material';
import {
  DataGrid,
  type GridCellParams,
  type GridColDef,
} from '@mui/x-data-grid';
import { Link as RouterLink } from 'react-router-dom';
import { getPlayer } from '../../shared/data';
import { formatRate, type DerivedStats } from '../../shared/stats';

export interface StatsGridProps {
  rows: Array<{ playerId: string; stats: DerivedStats }>;
}

type Row = { playerId: string; name: string } & DerivedStats;

// Columns rendered as rate stats: bolded and formatted with formatRate().
const RATE_FIELDS = new Set(['avg', 'obp', 'slg', 'ops']);
// Columns that start a new stat group; a vertical divider is drawn to their left.
const GROUP_SEP_FIELDS = new Set(['r', 'bb', 'avg']);

const NUMERIC_FIELDS = [
  'g',
  'pa',
  'ab',
  'r',
  'h',
  'singles',
  'doubles',
  'triples',
  'hr',
  'bb',
  'k',
  'avg',
  'obp',
  'slg',
  'ops',
] as const;

type NumericField = (typeof NUMERIC_FIELDS)[number];

interface ColumnSpec {
  field: NumericField;
  headerName: string;
  description: string;
  rate?: boolean;
}

// The order of this list is the on-screen column order. `Player` is prepended.
const COLUMN_SPECS: ColumnSpec[] = [
  { field: 'g', headerName: 'G', description: 'Games played' },
  {
    field: 'pa',
    headerName: 'PA',
    description: 'Plate appearances — at-bats + walks + sacrifice flies',
  },
  { field: 'ab', headerName: 'AB', description: 'At-bats' },
  { field: 'r', headerName: 'R', description: 'Runs scored' },
  { field: 'h', headerName: 'H', description: 'Hits' },
  { field: 'singles', headerName: '1B', description: 'Singles' },
  { field: 'doubles', headerName: '2B', description: 'Doubles' },
  { field: 'triples', headerName: '3B', description: 'Triples' },
  { field: 'hr', headerName: 'HR', description: 'Home runs' },
  { field: 'bb', headerName: 'BB', description: 'Walks (base on balls)' },
  { field: 'k', headerName: 'SO', description: 'Strikeouts' },
  {
    field: 'avg',
    headerName: 'AVG',
    description: 'Batting average — hits ÷ at-bats',
    rate: true,
  },
  {
    field: 'obp',
    headerName: 'OBP',
    description: 'On-base percentage — (hits + walks) ÷ plate appearances',
    rate: true,
  },
  {
    field: 'slg',
    headerName: 'SLG',
    description: 'Slugging percentage — total bases ÷ at-bats',
    rate: true,
  },
  { field: 'ops', headerName: 'OPS', description: 'On-base plus slugging', rate: true },
];

// Best value per numeric column, or null when a column has no eligible value
// (e.g. every player's AVG is null because nobody has an at-bat yet).
function computeLeaders(rows: Row[]): Record<NumericField, number | null> {
  const leaders = Object.fromEntries(
    NUMERIC_FIELDS.map((field) => [field, null]),
  ) as Record<NumericField, number | null>;

  for (const row of rows) {
    for (const field of NUMERIC_FIELDS) {
      const value = row[field];
      if (value === null || value === undefined) {
        continue;
      }
      const current = leaders[field];
      if (current === null || value > current) {
        leaders[field] = value;
      }
    }
  }

  return leaders;
}

function buildColumns(leaders: Record<NumericField, number | null>): GridColDef[] {
  const cellClass =
    (field: NumericField): GridColDef['cellClassName'] =>
    (params: GridCellParams) => {
      const classes: string[] = [];
      if (GROUP_SEP_FIELDS.has(field)) {
        classes.push('colgroup-sep');
      }
      if (RATE_FIELDS.has(field)) {
        classes.push('rate-stat');
      }
      // `===` on floats is fine here: ties are produced by identical inputs and
      // therefore identical double values, so every co-leader matches.
      if (leaders[field] !== null && params.value === leaders[field]) {
        classes.push('leader');
      }
      return classes.join(' ');
    };

  const statColumns: GridColDef[] = COLUMN_SPECS.map(
    ({ field, headerName, description, rate }) => ({
      field,
      headerName,
      description,
      type: 'number',
      width: rate ? 76 : 56,
      align: 'right',
      headerAlign: 'right',
      headerClassName: GROUP_SEP_FIELDS.has(field) ? 'colgroup-sep' : undefined,
      cellClassName: cellClass(field),
      ...(rate ? { valueFormatter: (value: number | null) => formatRate(value) } : {}),
    }),
  );

  return [
    {
      field: 'name',
      headerName: 'Player',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <MuiLink component={RouterLink} to={`/players/${params.row.playerId}`} color="secondary">
          {params.value}
        </MuiLink>
      ),
    },
    ...statColumns,
  ];
}

// leaderboard() already returns rows AVG-desc; the initial sort model just
// makes the grid state match (nulls sort last under descending order, and the
// stable sort keeps the PA tiebreak for equal averages).
export default function StatsGrid({ rows }: StatsGridProps) {
  const [query, setQuery] = useState('');

  const gridRows = useMemo<Row[]>(
    () =>
      rows.map(({ playerId, stats }) => ({
        playerId,
        name: getPlayer(playerId)?.name ?? playerId,
        ...stats,
      })),
    [rows],
  );

  // Leaders are computed over the full leaderboard, not the search-filtered
  // subset, so the highlighted cell is always the true season/phase leader.
  const leaders = useMemo(() => computeLeaders(gridRows), [gridRows]);
  const columns = useMemo(() => buildColumns(leaders), [leaders]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return gridRows;
    }
    return gridRows.filter((row) => row.name.toLowerCase().includes(q));
  }, [gridRows, query]);

  if (rows.length === 0) {
    return <Typography color="text.secondary">No games entered yet</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <TextField
        label="Search players"
        placeholder="Filter by name"
        size="small"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        sx={{ width: 280, maxWidth: '100%' }}
      />
      <DataGrid
        rows={visibleRows}
        columns={columns}
        getRowId={(row) => row.playerId}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 1 ? 'MuiDataGrid-row--striped' : ''
        }
        autoHeight
        hideFooter
        disableRowSelectionOnClick
        initialState={{ sorting: { sortModel: [{ field: 'avg', sort: 'desc' }] } }}
      />
    </Box>
  );
}
