import { createTheme } from '@mui/material/styles';

/** Brand anchors */
export const NAVY = '#001736';
export const TEAL = '#4cbea0';
export const TEAL_LIGHT = '#6fd6ba';

/**
 * Light mode: navy primary, teal secondary, light neutral background.
 * The AppBar uses the navy brand color with light text.
 */
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: NAVY,
      light: '#33506e',
      dark: '#000c1d',
      contrastText: '#ffffff',
    },
    secondary: {
      main: TEAL,
      light: TEAL_LIGHT,
      dark: '#3a9a80',
      contrastText: NAVY,
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: NAVY,
          color: '#ffffff',
        },
      },
    },
  },
});

/**
 * Dark mode: teal primary, lighter-teal secondary, navy background.
 * The AppBar uses the elevated navy-paper color with teal text.
 */
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: TEAL,
      light: TEAL_LIGHT,
      dark: '#3a9a80',
      contrastText: NAVY,
    },
    secondary: {
      main: TEAL_LIGHT,
      light: '#8ce0c8',
      dark: '#56a88f',
      contrastText: NAVY,
    },
    background: {
      default: NAVY,
      paper: '#0a2242',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0a2242',
          color: TEAL_LIGHT,
        },
      },
    },
  },
});
