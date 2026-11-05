import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Not Found');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
      <Typography variant="h4" component="h1">
        Page not found
      </Typography>
      <Typography>The page you are looking for does not exist.</Typography>
      <Button component={Link} to="/" variant="contained">
        Back to stats
      </Button>
    </Box>
  );
}
