import { Box, Typography } from '@mui/material';
import { seasons } from '../../shared/data';
import { leaderboard } from '../../shared/queries';
import SeasonPhaseControls from '../components/SeasonPhaseControls';
import StatsGrid from '../components/StatsGrid';
import { useSeasonFilter } from '../hooks/useSeasonFilter';

export default function StatsPage() {
  const { filter } = useSeasonFilter();
  const rows = leaderboard(seasons, filter);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4" component="h1">
        Stats
      </Typography>
      <SeasonPhaseControls />
      <StatsGrid rows={rows} />
    </Box>
  );
}
