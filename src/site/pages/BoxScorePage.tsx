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
import { CircleOff } from 'lucide-react';
import { getLocation, getPlayer, getTeam, seasons } from '../../shared/data';
import { gameWarnings } from '../../shared/validate';
import type { Game } from '../../shared/schema';
import { PHASE_LABELS, phaseColor } from '../phase';
import EmptyState from '../components/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import NotFound from './NotFound';

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
  useDocumentTitle('Box Score');

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
        Box Score
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        {game.date}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip label={PHASE_LABELS[game.phase]} size="small" color={phaseColor(game.phase)} />
        <Typography component="span">{opponentName}</Typography>
        {getLocation(game.locationId)?.name && (
          <Typography component="span" color="text.secondary">
            {getLocation(game.locationId)?.name}
          </Typography>
        )}
        <Typography component="span">
          {game.score.us}-{game.score.them}
        </Typography>
        <Chip label={result} size="small" color={resultColor(result)} />
      </Box>

      {game.lines.length === 0 ? (
        <EmptyState
          icon={CircleOff}
          title="No box score lines"
          message="This game doesn't have any player lines recorded."
        />
      ) : (
        <Table aria-label="Box score" size="small">
          <TableHead>
            <TableRow>
              <TableCell>Player</TableCell>
              <TableCell align="right">AB</TableCell>
              <TableCell align="right">H</TableCell>
              <TableCell align="right">1B</TableCell>
              <TableCell align="right">2B</TableCell>
              <TableCell align="right">3B</TableCell>
              <TableCell align="right">HR</TableCell>
              <TableCell align="right">BB</TableCell>
              <TableCell align="right">SF</TableCell>
              <TableCell align="right">K</TableCell>
              <TableCell align="right">R</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {game.lines.map((line) => {
              const player = getPlayer(line.playerId);
              return (
                <TableRow key={line.playerId}>
                  <TableCell>
                    <MuiLink component={RouterLink} to={`/players/${line.playerId}`} color="secondary">
                      {player?.name ?? line.playerId}
                    </MuiLink>
                  </TableCell>
                  <TableCell align="right">{line.ab}</TableCell>
                  <TableCell align="right">{hitCount(line)}</TableCell>
                  <TableCell align="right">{line['1b']}</TableCell>
                  <TableCell align="right">{line['2b']}</TableCell>
                  <TableCell align="right">{line['3b']}</TableCell>
                  <TableCell align="right">{line.hr}</TableCell>
                  <TableCell align="right">{line.bb}</TableCell>
                  <TableCell align="right">{line.sf}</TableCell>
                  <TableCell align="right">{line.k}</TableCell>
                  <TableCell align="right">{line.r}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {warnings.length > 0 && (
        <Typography color="text.secondary">Line data may be incomplete</Typography>
      )}
    </Box>
  );
}
