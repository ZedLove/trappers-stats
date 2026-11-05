import { AppBar, Box, Button, IconButton, Toolbar, Typography } from '@mui/material';
import { BarChart3, CalendarDays, Moon, Sun } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import SiteBreadcrumbs from './components/SiteBreadcrumbs';
import { useThemeMode } from './themeMode';
import logo from './trappers.png';

const navLinkSx = {
  color: 'inherit',
  '&.active': { fontWeight: 'bold', textDecoration: 'underline' },
};

export default function App() {
  const { mode, toggle } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Box
            component="img"
            src={logo}
            alt="Trappers logo"
            sx={{ width: 36, height: 36, objectFit: 'contain', borderRadius: '8px', mr: 1.5 }}
          />
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
          >
            Trappers
          </Typography>
          <Button component={NavLink} to="/" end sx={navLinkSx} startIcon={<BarChart3 size={18} />}>
            Stats
          </Button>
          <Button component={NavLink} to="/games" sx={navLinkSx} startIcon={<CalendarDays size={18} />}>
            Games
          </Button>
          <IconButton color="inherit" onClick={toggle} aria-label="Toggle theme" aria-pressed={isDark}>
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ p: 2 }}>
        <SiteBreadcrumbs />
        <Outlet />
      </Box>
    </>
  );
}
