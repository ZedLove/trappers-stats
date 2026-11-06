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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { getLocation, getSeason, getTeam, latestSeason } from '../../shared/data';
import { filterGames, sortGamesByDate, teamRecord } from '../../shared/queries';
import type { Game } from '../../shared/schema';
import PlayoffResults from '../components/PlayoffResults';
import SeasonPhaseControls from '../components/SeasonPhaseControls';
import StandingsTable from '../components/StandingsTable';
import EmptyState from '../components/EmptyState';
import { useSeasonFilter } from '../hooks/useSeasonFilter';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PHASE_LABELS, phaseColor } from '../phase';
import NotFound from './NotFound';

function ordinal(place: number): string {
  const rem100 = place % 100;
  if (rem100 >= 11 && rem100 <= 13) {
    return `${place}th`;
  }
  switch (place % 10) {
    case 1:
      return `${place}st`;
    case 2:
      return `${place}nd`;
    case 3:
      return `${place}rd`;
    default:
      return `${place}th`;
  }
}

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

export default function GamesPage() {
  const { filter } = useSeasonFilter();
  const navigate = useNavigate();
  useDocumentTitle('Games');
  // The season selector has no All-time option on this page, so an 'all'
  // filter (e.g. a pasted URL) falls back to the latest season.
  const seasonFile = filter.season === 'all' ? latestSeason() : getSeason(filter.season);

  if (!seasonFile) {
    return <NotFound />;
  }

  const record = teamRecord(seasonFile);
  const standings = seasonFile.results?.standings ?? [];
  const playoffs = seasonFile.results?.playoffs ?? [];
  const ourRank = standings.findIndex((standing) => getTeam(standing.teamId)?.us === true);

  const summaryParts = [`Record: ${record.w}-${record.l}-${record.t}`];
  if (seasonFile.division) {
    summaryParts.push(`Division ${seasonFile.division}`);
  }
  if (ourRank >= 0) {
    summaryParts.push(`Finished ${ordinal(ourRank + 1)}`);
  }

  const games = sortGamesByDate(
    filterGames([seasonFile], { season: seasonFile.season, phase: filter.phase }).map(
      (entry) => entry.game,
    ),
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4" component="h1">
        Games
      </Typography>
      <SeasonPhaseControls showAllTime={false} />
      <Typography>{summaryParts.join(' · ')}</Typography>
      {standings.length > 0 && <StandingsTable standings={standings} />}
      {playoffs.length > 0 && <PlayoffResults playoffs={playoffs} />}
      {games.length === 0 ? (
        <EmptyState
          title="No games yet"
          message="Games will appear here once the season gets going."
        />
      ) : (
        <TableContainer>
          <Table aria-label="Games" size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">Date</TableCell>
                <TableCell align="center">Opponent</TableCell>
                <TableCell align="center">Phase</TableCell>
                <TableCell align="center">Result</TableCell>
                <TableCell align="center">Score</TableCell>
                <TableCell align="center">Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {games.map((game) => {
                const result = gameResult(game);
                const opponentName = getTeam(game.opponentId)?.name ?? game.opponentId;
                return (
                  <TableRow
                    key={game.id}
                    hover
                    onClick={() => navigate(`/games/${game.id}`)}
                    sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell align="center">{game.date}</TableCell>
                    <TableCell>
                      <MuiLink
                        component={RouterLink}
                        to={`/games/${game.id}`}
                        onClick={(event) => event.stopPropagation()}
                        color="secondary"
                      >
                        {opponentName}
                      </MuiLink>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={PHASE_LABELS[game.phase]} size="small" color={phaseColor(game.phase)} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={result} size="small" color={resultColor(result)} />
                    </TableCell>
                    <TableCell align="center">
                      {game.score.us}-{game.score.them}
                    </TableCell>
                    <TableCell align="center">{getLocation(game.locationId)?.name ?? '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
