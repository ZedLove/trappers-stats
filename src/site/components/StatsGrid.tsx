import { Link as MuiLink, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { Link as RouterLink } from 'react-router-dom';
import { getPlayer } from '../../shared/data';
import { formatRate, type DerivedStats } from '../../shared/stats';

export interface StatsGridProps {
  rows: Array<{ playerId: string; stats: DerivedStats }>;
}

function rateColumn(field: string, headerName: string): GridColDef {
  return {
    field,
    headerName,
    type: 'number',
    width: 76,
    valueFormatter: (value: number | null) => formatRate(value),
  };
}

function countingColumn(field: string, headerName: string): GridColDef {
  return { field, headerName, type: 'number', width: 56 };
}

const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Player',
    flex: 1,
    minWidth: 140,
    renderCell: (params) => (
      <MuiLink component={RouterLink} to={`/players/${params.row.playerId}`}>
        {params.value}
      </MuiLink>
    ),
  },
  countingColumn('g', 'G'),
  countingColumn('pa', 'PA'),
  countingColumn('ab', 'AB'),
  countingColumn('r', 'R'),
  countingColumn('h', 'H'),
  countingColumn('singles', '1B'),
  countingColumn('doubles', '2B'),
  countingColumn('triples', '3B'),
  countingColumn('hr', 'HR'),
  countingColumn('bb', 'BB'),
  countingColumn('k', 'K'),
  rateColumn('avg', 'AVG'),
  rateColumn('obp', 'OBP'),
  rateColumn('slg', 'SLG'),
  rateColumn('ops', 'OPS'),
];

// leaderboard() already returns rows AVG-desc; the initial sort model just
// makes the grid state match (nulls sort last under descending order, and the
// stable sort keeps the PA tiebreak for equal averages).
export default function StatsGrid({ rows }: StatsGridProps) {
  if (rows.length === 0) {
    return <Typography color="text.secondary">No games entered yet</Typography>;
  }

  const gridRows = rows.map(({ playerId, stats }) => ({
    playerId,
    name: getPlayer(playerId)?.name ?? playerId,
    ...stats,
  }));

  return (
    <DataGrid
      rows={gridRows}
      columns={columns}
      getRowId={(row) => row.playerId}
      autoHeight
      hideFooter
      disableRowSelectionOnClick
      initialState={{ sorting: { sortModel: [{ field: 'avg', sort: 'desc' }] } }}
    />
  );
}
