import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { seasons } from '../../shared/data';
import type { Phase } from '../../shared/schema';
import { useSeasonFilter } from '../hooks/useSeasonFilter';

const PHASE_OPTIONS: Array<{ value: 'all' | Phase; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'regular', label: 'Regular Season' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'playoff', label: 'Playoffs' },
];

export interface SeasonPhaseControlsProps {
  showAllTime?: boolean;
}

export default function SeasonPhaseControls({ showAllTime = true }: SeasonPhaseControlsProps) {
  const { filter, setSeason, setPhase } = useSeasonFilter();

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel id="season-select-label">Season</InputLabel>
        <Select
          labelId="season-select-label"
          label="Season"
          value={String(filter.season)}
          onChange={(event) =>
            setSeason(event.target.value === 'all' ? 'all' : Number(event.target.value))
          }
        >
          {seasons.map((seasonFile) => (
            <MenuItem key={seasonFile.season} value={String(seasonFile.season)}>
              {seasonFile.season}
            </MenuItem>
          ))}
          {showAllTime && <MenuItem value="all">All-time</MenuItem>}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="phase-select-label">Phase</InputLabel>
        <Select
          labelId="phase-select-label"
          label="Phase"
          value={filter.phase}
          onChange={(event) => setPhase(event.target.value as 'all' | Phase)}
        >
          {PHASE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
