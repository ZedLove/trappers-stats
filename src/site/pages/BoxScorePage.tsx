import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Link as MuiLink,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import { CircleOff } from 'lucide-react';
import { getLocation, getPlayer, getTeam, getUsTeamName, seasons } from '../../shared/data';
import { sumLines } from '../../shared/stats';
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

interface LinescoreRow {
  name: string;
  runs: number[];
  r: number;
  h: number | undefined;
}

function buildLinescore(
  game: Game,
  awayName: string,
  homeName: string,
): LinescoreRow[] | null {
  if (!game.innings) return null;
  const trappersHits = sumLines(game.lines).h;
  return [
    {
      name: awayName,
      runs: game.innings.map((inning) => (game.isHome ? inning.them : inning.us)),
      r: game.isHome ? game.score.them : game.score.us,
      h: game.isHome ? game.opponentHits : trappersHits,
    },
    {
      name: homeName,
      runs: game.innings.map((inning) => (game.isHome ? inning.us : inning.them)),
      r: game.isHome ? game.score.us : game.score.them,
      h: game.isHome ? trappersHits : game.opponentHits,
    },
  ];
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
  const usName = getUsTeamName();
  const awayName = game.isHome ? opponentName : usName;
  const homeName = game.isHome ? usName : opponentName;
  const linescore = buildLinescore(game, awayName, homeName);
  const result = gameResult(game);
  const warnings = gameWarnings(game);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4" component="h1">
        Box Score
      </Typography>
      <Typography variant="h5" component="h2">
        {awayName} @ {homeName}
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

      {linescore && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            Linescore
          </Typography>
          <TableContainer>
            <Table aria-label="Linescore" size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Team</TableCell>
                  {linescore[0].runs.map((_, index) => (
                    <TableCell key={index} align="center">
                      {index + 1}
                    </TableCell>
                  ))}
                  <TableCell align="center">R</TableCell>
                  <TableCell align="center">H</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {linescore.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell>{row.name}</TableCell>
                    {row.runs.map((run, index) => (
                      <TableCell key={index} align="center">
                        {run}
                      </TableCell>
                    ))}
                    <TableCell align="center">{row.r}</TableCell>
                    <TableCell align="center">{row.h ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
          Batting
        </Typography>
        {game.lines.length === 0 ? (
          <EmptyState
            icon={CircleOff}
            title="No box score lines"
            message="This game doesn't have any player lines recorded."
          />
        ) : (
          <TableContainer>
            <Table aria-label="Box score" size="small">
            <TableHead>
              <TableRow>
                <TableCell className="sticky-col" align="center">Player</TableCell>
                <TableCell align="center">AB</TableCell>
                <TableCell align="center">H</TableCell>
                <TableCell align="center">1B</TableCell>
                <TableCell align="center">2B</TableCell>
                <TableCell align="center">3B</TableCell>
                <TableCell align="center">HR</TableCell>
                <TableCell align="center">BB</TableCell>
                <TableCell align="center">SF</TableCell>
                <TableCell align="center">K</TableCell>
                <TableCell align="center">R</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {game.lines.map((line) => {
                const player = getPlayer(line.playerId);
                return (
                  <TableRow key={line.playerId}>
                    <TableCell className="sticky-col">
                      <MuiLink component={RouterLink} to={`/players/${line.playerId}`} color="secondary">
                        {player?.name ?? line.playerId}
                      </MuiLink>
                    </TableCell>
                    <TableCell align="center">{line.ab}</TableCell>
                    <TableCell align="center">{hitCount(line)}</TableCell>
                    <TableCell align="center">{line['1b']}</TableCell>
                    <TableCell align="center">{line['2b']}</TableCell>
                    <TableCell align="center">{line['3b']}</TableCell>
                    <TableCell align="center">{line.hr}</TableCell>
                    <TableCell align="center">{line.bb}</TableCell>
                    <TableCell align="center">{line.sf}</TableCell>
                    <TableCell align="center">{line.k}</TableCell>
                    <TableCell align="center">{line.r}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      </Paper>

      {warnings.length > 0 && (
        <Typography color="text.secondary">Line data may be incomplete</Typography>
      )}
    </Box>
  );
}
