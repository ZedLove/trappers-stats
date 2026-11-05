import { useState } from 'react';
import { AppBar, Box, CssBaseline, Tab, Tabs, Toolbar, Typography } from '@mui/material';

type ScreenId = 'game' | 'players' | 'teams' | 'results';

const screens: Array<{ id: ScreenId; label: string; placeholder: string }> = [
  { id: 'game', label: 'Game Entry', placeholder: 'Game entry form — coming in a later task.' },
  { id: 'players', label: 'Players', placeholder: 'Player management — coming in a later task.' },
  { id: 'teams', label: 'Teams', placeholder: 'Team management — coming in a later task.' },
  {
    id: 'results',
    label: 'Season Results',
    placeholder: 'Season results editing — coming in a later task.',
  },
];

export default function AdminApp() {
  const [screen, setScreen] = useState<ScreenId>('game');
  const current = screens.find((candidate) => candidate.id === screen) ?? screens[0];

  return (
    <>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Trappers Admin
          </Typography>
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
        <Typography variant="h5" component="h1">
          {current.label}
        </Typography>
        <Typography sx={{ mt: 1 }}>{current.placeholder}</Typography>
      </Box>
    </>
  );
}
