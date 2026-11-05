import { useState } from 'react';
import { AppBar, Box, IconButton, Tab, Tabs, Toolbar, Typography } from '@mui/material';
import { Moon, Sun } from 'lucide-react';
import { useThemeMode } from '../theme/themeMode';
import GameEntry from './screens/GameEntry';
import ManageLocations from './screens/ManageLocations';
import ManagePlayers from './screens/ManagePlayers';
import ManageTeams from './screens/ManageTeams';
import SeasonResults from './screens/SeasonResults';

type ScreenId = 'game' | 'players' | 'teams' | 'locations' | 'results';

const screens: Array<{ id: ScreenId; label: string }> = [
  { id: 'game', label: 'Game Entry' },
  { id: 'players', label: 'Players' },
  { id: 'teams', label: 'Teams' },
  { id: 'locations', label: 'Locations' },
  { id: 'results', label: 'Season Results' },
];

export default function AdminApp() {
  const [screen, setScreen] = useState<ScreenId>('game');
  const { mode, toggle } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Trappers Admin
          </Typography>
          <IconButton color="inherit" onClick={toggle} aria-label="Toggle theme" aria-pressed={isDark}>
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </IconButton>
        </Toolbar>
        <Tabs
          value={screen}
          onChange={(_, value: ScreenId) => setScreen(value)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="inherit"
          indicatorColor="secondary"
          sx={{ px: 1 }}
        >
          {screens.map((candidate) => (
            <Tab key={candidate.id} value={candidate.id} label={candidate.label} />
          ))}
        </Tabs>
      </AppBar>
      <Box component="main" sx={{ p: 2 }}>
        {screen === 'game' ? (
          <GameEntry />
        ) : screen === 'players' ? (
          <ManagePlayers />
        ) : screen === 'teams' ? (
          <ManageTeams />
        ) : screen === 'locations' ? (
          <ManageLocations />
        ) : (
          <SeasonResults />
        )}
      </Box>
    </>
  );
}
