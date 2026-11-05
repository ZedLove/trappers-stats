import {
  Box,
  Chip,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { getPlayer, getTeam, seasons } from '../../shared/data';
import { playerGameLog, playerStatsBySeason } from '../../shared/queries';
import type { PlayerLine } from '../../shared/schema';
import { deriveStats, formatRate, sumLines, type DerivedStats } from '../../shared/stats';
import { PHASE_LABELS, phaseColor } from '../phase';
import EmptyState from '../components/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import NotFound from './NotFound';

const STAT_HEADERS = [
  'G',
  'PA',
  'AB',
  'R',
  'H',
  '1B',
  '2B',
  '3B',
  'HR',
  'BB',
  'K',
  'AVG',
  'OBP',
  'SLG',
  'OPS',
];

function statValues(stats: DerivedStats): Array<string | number> {
  return [
    stats.g,
    stats.pa,
    stats.ab,
    stats.r,
    stats.h,
    stats.singles,
    stats.doubles,
    stats.triples,
    stats.hr,
    stats.bb,
    stats.k,
    formatRate(stats.avg),
    formatRate(stats.obp),
    formatRate(stats.slg),
    formatRate(stats.ops),
  ];
}

function hitCount(line: PlayerLine): number {
  return line['1b'] + line['2b'] + line['3b'] + line.hr;
}

function StatsTable({ ariaLabel, rows }: { ariaLabel: string; rows: DerivedStats[] }) {
  return (
    <TableContainer>
      <Table aria-label={ariaLabel} size="small">
        <TableHead>
          <TableRow>
            {STAT_HEADERS.map((header) => (
              <TableCell key={header} align="center">
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((stats, index) => (
            <TableRow key={index}>
              {statValues(stats).map((value, cellIndex) => (
                <TableCell key={cellIndex} align="right">
                  {value}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default function PlayerPage() {
  const { playerId } = useParams<{ playerId: string }>();
  const player = playerId ? getPlayer(playerId) : undefined;

  // When the player is missing we still set "Player" (rather than the display
  // name); the NotFound fallback below handles the copy on the page itself.
  useDocumentTitle(player?.name ?? 'Player');

  if (!player) {
    return <NotFound />;
  }

  const log = playerGameLog(seasons, player.id);
  const career = deriveStats(sumLines(log.map((entry) => entry.line)));
  const seasonRows = playerStatsBySeason(seasons, player.id);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4" component="h1">
        {player.name}
      </Typography>

      <Typography variant="h6" component="h2">
        Career
      </Typography>
      <StatsTable ariaLabel="Career" rows={[career]} />

      <Typography variant="h6" component="h2">
        Season by season
      </Typography>
      <TableContainer>
        <Table aria-label="Season by season" size="small">
          <TableHead>
            <TableRow>
              <TableCell>Season</TableCell>
              {STAT_HEADERS.map((header) => (
                <TableCell key={header} align="center">
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {seasonRows.map(({ season, stats }) => (
              <TableRow key={season}>
                <TableCell>{season}</TableCell>
                {statValues(stats).map((value, cellIndex) => (
                  <TableCell key={cellIndex} align="right">
                    {value}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" component="h2">
        Game log
      </Typography>
      {log.length === 0 ? (
        <EmptyState title="No games logged" message="This player hasn't recorded a line yet." />
      ) : (
        <TableContainer>
          <Table aria-label="Game log" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Opponent</TableCell>
                <TableCell>Phase</TableCell>
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
              {log.map(({ game, line }) => (
                <TableRow key={game.id}>
                  <TableCell>{game.date}</TableCell>
                  <TableCell>
                    <MuiLink component={RouterLink} to={`/games/${game.id}`} color="secondary">
                      {getTeam(game.opponentId)?.name ?? game.opponentId}
                    </MuiLink>
                  </TableCell>
                  <TableCell>
                    <Chip label={PHASE_LABELS[game.phase]} size="small" color={phaseColor(game.phase)} />
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
