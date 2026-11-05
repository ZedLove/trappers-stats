import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { getTeam } from '../../shared/data';
import type { Standing } from '../../shared/schema';

export interface StandingsTableProps {
  standings: Standing[];
}

// Rank is the array order in the season file. Our team's row is highlighted.
export default function StandingsTable({ standings }: StandingsTableProps) {
  return (
    <>
      <Typography variant="h6" component="h2">
        Standings
      </Typography>
      <Table aria-label="Standings" size="small">
        <TableHead>
          <TableRow>
            <TableCell align="right">#</TableCell>
            <TableCell>Team</TableCell>
            <TableCell align="right">W</TableCell>
            <TableCell align="right">L</TableCell>
            <TableCell align="right">T</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {standings.map((standing, index) => {
            const team = getTeam(standing.teamId);
            return (
              <TableRow key={standing.teamId} selected={team?.us === true}>
                <TableCell align="right">{index + 1}</TableCell>
                <TableCell>{team?.name ?? standing.teamId}</TableCell>
                <TableCell align="right">{standing.wins ?? '—'}</TableCell>
                <TableCell align="right">{standing.losses ?? '—'}</TableCell>
                <TableCell align="right">{standing.ties ?? '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
