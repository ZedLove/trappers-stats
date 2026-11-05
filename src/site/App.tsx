import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { BarChart3, CalendarDays, Moon, Sun } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import SiteBreadcrumbs from './components/SiteBreadcrumbs';
import { useThemeMode } from '../theme/themeMode';
import logo from './trappers.png';

export default function App() {
  const { mode, toggle } = useThemeMode();
  const theme = useTheme();
  const isDark = mode === 'dark';
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  // Active nav gets a teal underline/color so the current tab reads clearly
  // against the navy AppBar in both light and dark mode.
  const navLinkSx = {
    color: 'inherit',
    '&.active': {
      fontWeight: 'bold',
      color: theme.palette.secondary.main,
      textDecoration: 'underline',
      textDecorationColor: theme.palette.secondary.main,
      textDecorationThickness: '2px',
      textUnderlineOffset: '4px',
    },
  };

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Box
            component="img"
            src={logo}
            alt="Trappers logo"
            sx={{ width: 36, height: 36, objectFit: 'contain', borderRadius: '8px', mr: 1.5 }}
          />
          {isPhone ? (
            <Box sx={{ flexGrow: 1 }} />
          ) : (
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
            >
              Trappers
            </Typography>
          )}
          {isPhone ? (
            <>
              <IconButton component={NavLink} to="/" end color="inherit" sx={navLinkSx} aria-label="Stats">
                <BarChart3 size={20} />
              </IconButton>
              <IconButton component={NavLink} to="/games" color="inherit" sx={navLinkSx} aria-label="Games">
                <CalendarDays size={20} />
              </IconButton>
            </>
          ) : (
            <>
              <Button component={NavLink} to="/" end sx={navLinkSx} startIcon={<BarChart3 size={18} />}>
                Stats
              </Button>
              <Button component={NavLink} to="/games" sx={navLinkSx} startIcon={<CalendarDays size={18} />}>
                Games
              </Button>
            </>
          )}
          <IconButton color="inherit" onClick={toggle} aria-label="Toggle theme" aria-pressed={isDark}>
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ p: { xs: 1.5, sm: 2 } }}>
        <SiteBreadcrumbs />
        <Outlet />
        <Box component="footer" sx={{ mt: 4, py: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            © 2026 Tri-City Trappers Slo-Pitch Club
          </Typography>
        </Box>
      </Box>
    </>
  );
}
