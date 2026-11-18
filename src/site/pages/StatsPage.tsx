import { Box, Typography } from '@mui/material';
import { seasons } from '../../shared/data';
import { isQualified } from '../../shared/qualification';
import { filterGames, leaderboard } from '../../shared/queries';
import SeasonPhaseControls from '../components/SeasonPhaseControls';
import StatsGrid from '../components/StatsGrid';
import { useSeasonFilter } from '../hooks/useSeasonFilter';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function StatsPage() {
  const { filter, qualified } = useSeasonFilter();
  // The threshold scales with however many games the team played in the
  // period currently being viewed (a season, a phase, or all-time).
  const teamGames = filterGames(seasons, filter).length;
  const allRows = leaderboard(seasons, filter);
  const rows = qualified
    ? allRows.filter(({ stats }) => isQualified(stats, teamGames))
    : allRows;
  useDocumentTitle('Stats');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4" component="h1">
        Stats
      </Typography>
      <SeasonPhaseControls showQualification />
      <StatsGrid rows={rows} />
    </Box>
  );
}
