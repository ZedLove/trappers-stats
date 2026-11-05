import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Link as MuiLink,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import { getPlayer, getTeam, seasons } from '../../shared/data';
import { gameWarnings } from '../../shared/validate';
import type { Game, Phase } from '../../shared/schema';
import NotFound from './NotFound';

const PHASE_LABELS: Record<Phase, string> = {
  regular: 'Regular Season',
  round_robin: 'Round Robin',
  playoff: 'Playoffs',
};

function gameResult(game: Game): 'W' | 'L' | 'T' {
  if (game.score.us > game.score.them) return 'W';
  if (game.score.us < game.score.them) return 'L';
  return 'T';
}

function resultColor(result: 'W' | 'L' | 'T'): 'success' | 'error' | 'default' {
  if (result === 'W') return 'success';
  if (result === 'L') return 'error';
  return 'default';
}

function hitCount(line: { '1b': number; '2b': number; '3b': number; hr: number }): number {
  return line['1b'] + line['2b'] + line['3b'] + line.hr;
}

export default function BoxScorePage() {
  const { gameId } = useParams<{ gameId: string }>();

  const found = seasons
    .flatMap((season) => season.games.map((game) => ({ season: season.season, game })))
    .find((entry) => entry.game.id === gameId);

  if (!found) {
    return <NotFound />;
  }

  const { game } = found;
  const opponentName = getTeam(game.opponentId)?.name ?? game.opponentId;
  const result = gameResult(game);
  const warnings = gameWarnings(game);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4" component="h1">
        {game.date}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip label={PHASE_LABELS[game.phase]} size="small" />
        <Typography component="span">{opponentName}</Typography>
        {game.location && (
          <Typography component="span" color="text.secondary">
            {game.location}
          </Typography>
        )}
        <Typography component="span">
          {game.score.us}-{game.score.them}
        </Typography>
        <Chip label={result} size="small" color={resultColor(result)} />
      </Box>

      <Table aria-label="Box score" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Player</TableCell>
            <TableCell>AB</TableCell>
            <TableCell>H</TableCell>
            <TableCell>1B</TableCell>
            <TableCell>2B</TableCell>
            <TableCell>3B</TableCell>
            <TableCell>HR</TableCell>
            <TableCell>BB</TableCell>
            <TableCell>SF</TableCell>
            <TableCell>K</TableCell>
            <TableCell>R</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {game.lines.map((line) => {
            const player = getPlayer(line.playerId);
            return (
              <TableRow key={line.playerId}>
                <TableCell>
                  <MuiLink component={RouterLink} to={`/players/${line.playerId}`}>
                    {player?.name ?? line.playerId}
                  </MuiLink>
                </TableCell>
                <TableCell>{line.ab}</TableCell>
                <TableCell>{hitCount(line)}</TableCell>
                <TableCell>{line['1b']}</TableCell>
                <TableCell>{line['2b']}</TableCell>
                <TableCell>{line['3b']}</TableCell>
                <TableCell>{line.hr}</TableCell>
                <TableCell>{line.bb}</TableCell>
                <TableCell>{line.sf}</TableCell>
                <TableCell>{line.k}</TableCell>
                <TableCell>{line.r}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {warnings.length > 0 && (
        <Typography color="text.secondary">Line data may be incomplete</Typography>
      )}
    </Box>
  );
}
