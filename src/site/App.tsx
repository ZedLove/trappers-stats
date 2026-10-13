import { AppBar, Box, Button, CssBaseline, Toolbar, Typography } from '@mui/material';
import { Link, NavLink, Outlet } from 'react-router-dom';

const navLinkSx = {
  color: 'inherit',
  '&.active': { fontWeight: 'bold', textDecoration: 'underline' },
};

export default function App() {
  return (
    <>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
          >
            Trappers
          </Typography>
          <Button component={NavLink} to="/" end sx={navLinkSx}>
            Stats
          </Button>
          <Button component={NavLink} to="/games" sx={navLinkSx}>
            Games
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ p: 2 }}>
        <Outlet />
      </Box>
    </>
  );
}
