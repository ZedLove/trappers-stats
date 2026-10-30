import { Box, Chip, List, ListItem, ListItemButton, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { getSeason, getTeam, latestSeason } from '../../shared/data';
import { filterGames, sortGamesByDate, teamRecord } from '../../shared/queries';
import type { Game, Phase } from '../../shared/schema';
import PlayoffResults from '../components/PlayoffResults';
import SeasonPhaseControls from '../components/SeasonPhaseControls';
import StandingsTable from '../components/StandingsTable';
import { useSeasonFilter } from '../hooks/useSeasonFilter';
import NotFound from './NotFound';

const PHASE_LABELS: Record<Phase, string> = {
  regular: 'Regular Season',
  round_robin: 'Round Robin',
  playoff: 'Playoffs',
};

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
        <Typography color="text.secondary">No games entered yet</Typography>
      ) : (
        <List aria-label="Games" disablePadding>
          {games.map((game) => {
            const result = gameResult(game);
            return (
              <ListItem key={game.id} disablePadding>
                <ListItemButton
                  component={RouterLink}
                  to={`/games/${game.id}`}
                  sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <Typography component="span">{game.date}</Typography>
                  <Typography component="span">
                    {getTeam(game.opponentId)?.name ?? game.opponentId}
                  </Typography>
                  <Chip label={PHASE_LABELS[game.phase]} size="small" />
                  <Chip label={result} size="small" color={resultColor(result)} />
                  <Typography component="span">
                    {game.score.us}-{game.score.them}
                  </Typography>
                  {game.location && (
                    <Typography component="span" color="text.secondary">
                      {game.location}
                    </Typography>
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
}
