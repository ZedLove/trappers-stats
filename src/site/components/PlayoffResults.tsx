import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { getTeam } from '../../shared/data';
import type { PlayoffMatchup } from '../../shared/schema';

export interface PlayoffResultsProps {
  playoffs: PlayoffMatchup[];
}

function teamName(teamId: string): string {
  return getTeam(teamId)?.name ?? teamId;
}

export default function PlayoffResults({ playoffs }: PlayoffResultsProps) {
  return (
    <>
      <Typography variant="h6" component="h2">
        Playoffs
      </Typography>
      <TableContainer>
        <Table aria-label="Playoff results" size="small">
          <TableHead>
            <TableRow>
              <TableCell>Round</TableCell>
              <TableCell>Matchup</TableCell>
              <TableCell>Winner</TableCell>
              <TableCell>Note</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {playoffs.map((matchup, index) => (
              <TableRow key={`${matchup.round}-${index}`}>
                <TableCell>{matchup.round}</TableCell>
                <TableCell>
                  {teamName(matchup.teamA)} vs {teamName(matchup.teamB)}
                </TableCell>
                <TableCell>{matchup.winner ? teamName(matchup.winner) : '—'}</TableCell>
                <TableCell>{matchup.note ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
