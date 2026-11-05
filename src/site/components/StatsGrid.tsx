import { useMemo, useState } from 'react';
import { Box, Link as MuiLink, TextField, useMediaQuery, useTheme } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { SearchX } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { getPlayer } from '../../shared/data';
import { formatRate, type DerivedStats } from '../../shared/stats';
import EmptyState from './EmptyState';
import StatsCards, { type PlayerStatRow } from './StatsCards';

export interface StatsGridProps {
  rows: Array<{ playerId: string; stats: DerivedStats }>;
}

// Columns rendered as rate stats: bolded and formatted with formatRate().
const RATE_FIELDS = new Set(['avg', 'obp', 'slg', 'ops']);
// Columns that start a new stat group; a vertical divider is drawn to their left.
const GROUP_SEP_FIELDS = new Set(['r', 'bb', 'avg']);

type NumericField =
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
  | 'k'
  | 'avg'
  | 'obp'
  | 'slg'
  | 'ops';

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

function buildColumns(): GridColDef[] {
  const cellClass =
    (field: NumericField): GridColDef['cellClassName'] =>
    () => {
      const classes: string[] = [];
      if (GROUP_SEP_FIELDS.has(field)) {
        classes.push('colgroup-sep');
      }
      if (RATE_FIELDS.has(field)) {
        classes.push('rate-stat');
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
      headerAlign: 'center',
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [query, setQuery] = useState('');

  const gridRows = useMemo<PlayerStatRow[]>(
    () =>
      rows.map(({ playerId, stats }) => ({
        playerId,
        name: getPlayer(playerId)?.name ?? playerId,
        ...stats,
      })),
    [rows],
  );

  const columns = useMemo(() => buildColumns(), []);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return gridRows;
    }
    return gridRows.filter((row) => row.name.toLowerCase().includes(q));
  }, [gridRows, query]);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No games yet"
        message="Stats will appear here once the first game is entered."
      />
    );
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
      {visibleRows.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No players found"
          message={`No players match “${query.trim()}”.`}
        />
      ) : isMobile ? (
        <StatsCards rows={visibleRows} />
      ) : (
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
      )}
    </Box>
  );
}
