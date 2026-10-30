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
            <TableCell>#</TableCell>
            <TableCell>Team</TableCell>
            <TableCell>W</TableCell>
            <TableCell>L</TableCell>
            <TableCell>T</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {standings.map((standing, index) => {
            const team = getTeam(standing.teamId);
            return (
              <TableRow key={standing.teamId} selected={team?.us === true}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{team?.name ?? standing.teamId}</TableCell>
                <TableCell>{standing.wins ?? '—'}</TableCell>
                <TableCell>{standing.losses ?? '—'}</TableCell>
                <TableCell>{standing.ties ?? '—'}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
