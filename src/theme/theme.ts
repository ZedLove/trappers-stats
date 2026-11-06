import { alpha, createTheme, type Theme } from '@mui/material/styles';

/** Brand anchors */
export const NAVY = '#001736';
export const TEAL = '#4cbea0';
export const TEAL_LIGHT = '#6fd6ba';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Opaque equivalent of `foreground` at `opacity` composited over `background`. */
function solidTint(foreground: string, background: string, opacity: number): string {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  const [r, g, b] = fg.map((c, i) => Math.round(c * opacity + bg[i] * (1 - opacity)));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Alternating-row (zebra) striping shared by every table and the data grid.
 * `tint` is a low-opacity teal so the stripes stay subtle and text remains
 * readable in both light and dark mode. `zebraSolid` is the same tint made
 * opaque (composited over `background.paper`) — used only by the sticky
 * player-name cell, whose background must be solid so scrolling columns
 * don't show through it.
 */
function zebraOverrides(tint: string, zebraSolid: string) {
  return {
    MuiTableRow: {
      styleOverrides: {
        root: {
          // `:not(.Mui-selected):not(:hover)` preserves the standings highlight
          // and the row-hover feedback on striped rows.
          '&:nth-of-type(even):not(.Mui-selected):not(:hover)': {
            backgroundColor: tint,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          // Pins the `.sticky-col` (first/player-name) cell so it stays visible
          // during horizontal scroll. The cell is opaque so scrolling columns
          // don't show through beneath it; its background matches the row
          // (paper normally, tint on the striped even rows).
          '&.sticky-col': {
            position: 'sticky',
            left: 0,
            zIndex: 1,
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
          'tr:nth-of-type(even) &.sticky-col': {
            backgroundColor: zebraSolid,
          },
        }),
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: ({ theme }: { theme: Theme }) => ({
          '& .MuiDataGrid-row--striped': {
            backgroundColor: tint,
          },
          // Vertical divider before the first column of each stat group
          // (R, BB, AVG). Applied to both header and body cells via the
          // `colgroup-sep` className set in StatsGrid's column definitions.
          '& .colgroup-sep': {
            borderLeft: `1px solid ${theme.palette.divider}`,
          },
          // Rate stats (AVG/OBP/SLG/OPS) are emphasized with a bold teal tint.
          '& .rate-stat': {
            fontWeight: 600,
            color: theme.palette.secondary.main,
          },
        }),
      },
    },
  };
}

/**
 * Player/opponent links are teal (`color="secondary"`); this gives them a
 * visible hover color so interactive elements clearly stand out.
 */
function linkOverrides(hoverColor: string) {
  return {
    MuiLink: {
      styleOverrides: {
        root: {
          '&:hover': {
            color: hoverColor,
          },
        },
      },
    },
  };
}

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
    ...zebraOverrides(alpha(TEAL, 0.07), solidTint(TEAL, '#ffffff', 0.07)),
    ...linkOverrides('#3a9a80'), // secondary.dark
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
    ...zebraOverrides(alpha(TEAL_LIGHT, 0.08), solidTint(TEAL_LIGHT, '#0a2242', 0.08)),
    ...linkOverrides('#8ce0c8'), // secondary.light
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
