import { Breadcrumbs, Link as MuiLink, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { getPlayer } from '../../shared/data';

/**
 * Breadcrumbs for the deep pages. Top-level pages (Stats, Games) already have
 * AppBar nav, so nothing is rendered there.
 */
export default function SiteBreadcrumbs() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/players/')) {
    const id = pathname.slice('/players/'.length);
    return (
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to="/" color="inherit">
          Stats
        </MuiLink>
        <Typography color="text.primary">{getPlayer(id)?.name ?? id}</Typography>
      </Breadcrumbs>
    );
  }

  if (pathname.startsWith('/games/')) {
    return (
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <MuiLink component={RouterLink} to="/games" color="inherit">
          Games
        </MuiLink>
        <Typography color="text.primary">Box Score</Typography>
      </Breadcrumbs>
    );
  }

  return null;
}
