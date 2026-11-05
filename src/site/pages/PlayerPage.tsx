import {
  Box,
  Chip,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { getPlayer, getTeam, seasons } from '../../shared/data';
import { playerGameLog, playerStatsBySeason } from '../../shared/queries';
import type { Phase, PlayerLine } from '../../shared/schema';
import { deriveStats, formatRate, sumLines, type DerivedStats } from '../../shared/stats';
import NotFound from './NotFound';

const PHASE_LABELS: Record<Phase, string> = {
  regular: 'Regular Season',
  round_robin: 'Round Robin',
  playoff: 'Playoffs',
};

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
    <Table aria-label={ariaLabel} size="small">
      <TableHead>
        <TableRow>
          {STAT_HEADERS.map((header) => (
            <TableCell key={header}>{header}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((stats, index) => (
          <TableRow key={index}>
            {statValues(stats).map((value, cellIndex) => (
              <TableCell key={cellIndex}>{value}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function PlayerPage() {
  const { playerId } = useParams<{ playerId: string }>();
  const player = playerId ? getPlayer(playerId) : undefined;

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
      <Table aria-label="Season by season" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Season</TableCell>
            {STAT_HEADERS.map((header) => (
              <TableCell key={header}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {seasonRows.map(({ season, stats }) => (
            <TableRow key={season}>
              <TableCell>{season}</TableCell>
              {statValues(stats).map((value, cellIndex) => (
                <TableCell key={cellIndex}>{value}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography variant="h6" component="h2">
        Game log
      </Typography>
      <Table aria-label="Game log" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Opponent</TableCell>
            <TableCell>Phase</TableCell>
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
          {log.map(({ game, line }) => (
            <TableRow key={game.id}>
              <TableCell>{game.date}</TableCell>
              <TableCell>
                <MuiLink component={RouterLink} to={`/games/${game.id}`}>
                  {getTeam(game.opponentId)?.name ?? game.opponentId}
                </MuiLink>
              </TableCell>
              <TableCell>
                <Chip label={PHASE_LABELS[game.phase]} size="small" />
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
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
