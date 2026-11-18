import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Paper,
  Select,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Activity,
  Award,
  Crown,
  Flame,
  Footprints,
  Medal,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { getPlayer, seasons } from '../../shared/data';
import {
  type LeaderEntry,
  type LeaderField,
  type LeaderRow,
  leadersFor,
  rankEntries,
} from '../../shared/leaders';
import { filterGames, leaderboard, type SeasonFilter } from '../../shared/queries';
import { formatRate } from '../../shared/stats';
import { type StreakField, streaksFor } from '../../shared/streaks';
import EmptyState from '../components/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface Category {
  field: LeaderField | StreakField;
  label: string;
  short: string;
  rate: boolean;
  icon: LucideIcon;
}

const TRIPLE_CROWN: Array<Category & { field: LeaderField }> = [
  { field: 'avg', label: 'Batting Average', short: 'AVG', rate: true, icon: Target },
  { field: 'ops', label: 'OPS', short: 'OPS', rate: true, icon: Zap },
  { field: 'hr', label: 'Home Runs', short: 'HR', rate: false, icon: Flame },
];

const HONOURABLE_MENTIONS: Array<Category & { field: LeaderField }> = [
  { field: 'singles', label: 'Singles', short: '1B', rate: false, icon: Star },
  { field: 'doubles', label: 'Doubles', short: '2B', rate: false, icon: Medal },
  { field: 'triples', label: 'Triples', short: '3B', rate: false, icon: TrendingUp },
  { field: 'bb', label: 'Walks', short: 'BB', rate: false, icon: Award },
];

const STREAKS: Array<Category & { field: StreakField }> = [
  { field: 'hit', label: 'Hit Streak', short: 'HIT', rate: false, icon: Activity },
  { field: 'onbase', label: 'On-base Streak', short: 'OB', rate: false, icon: Footprints },
  { field: 'nok', label: 'Strikeout-less Streak', short: '0K', rate: false, icon: ShieldCheck },
  { field: 'xbh', label: 'Extra Base Streak', short: 'XBH', rate: false, icon: Flame },
];

// The podium shrinks as rank increases; places four and five read as plain text.
const PODIUM_VARIANTS = { 1: 'h3', 2: 'h4', 3: 'h5' } as const;

// Gold / silver / bronze, tuned per theme so each podium place stays legible.
const PODIUM_COLORS = {
  1: { light: '#a16207', dark: '#facc15', label: '1st' },
  2: { light: '#475569', dark: '#cbd5e1', label: '2nd' },
  3: { light: '#9a3412', dark: '#fdba74', label: '3rd' },
} as const;

function formatValue(category: Category, value: number): string {
  return category.rate ? formatRate(value) : String(value);
}

function LeaderEntryView({
  entry,
  category,
  index,
}: {
  entry: LeaderEntry;
  category: Category;
  index: number;
}) {
  const theme = useTheme();
  const { rank, value, row } = entry;
  const podium = rank <= 3 ? PODIUM_COLORS[rank as 1 | 2 | 3] : undefined;
  const accent = podium
    ? theme.palette.mode === 'dark'
      ? podium.dark
      : podium.light
    : undefined;
  const valueVariant = podium ? PODIUM_VARIANTS[rank as 1 | 2 | 3] : 'body2';
  const nameVariant = rank === 1 ? 'subtitle1' : rank === 2 ? 'body1' : 'body2';

  return (
    <Box
      component="li"
      data-testid={`leader-${category.field}-${index + 1}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 0,
        px: podium ? 1 : 0.5,
        py: podium ? 0.75 : 0.25,
        borderRadius: 1.5,
        borderLeft: '3px solid',
        borderColor: accent ?? 'transparent',
        bgcolor: accent ? alpha(accent, theme.palette.mode === 'dark' ? 0.16 : 0.1) : 'transparent',
      }}
    >
      {/* Fixed-width rank column keeps the value and name aligned across rows. */}
      <Box
        component="span"
        sx={{ width: 34, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        {podium && (
          <Medal
            size={14}
            color={accent}
            aria-label={`${podium.label} place`}
            data-testid={`medal-${category.field}-${index + 1}`}
          />
        )}
        <Typography
          component="span"
          data-testid={`leader-${category.field}-${index + 1}-rank`}
          variant="caption"
          color={accent ?? 'text.disabled'}
          sx={{ fontWeight: podium ? 700 : 400 }}
        >
          {rank}.
        </Typography>
      </Box>
      <Typography
        component="span"
        data-testid={`leader-${category.field}-${index + 1}-value`}
        variant={valueVariant}
        color={accent ?? 'text.secondary'}
        sx={{ minWidth: 48, flexShrink: 0, textAlign: 'right', whiteSpace: 'nowrap', lineHeight: 1.15, fontWeight: podium ? 700 : 400 }}
      >
        {formatValue(category, value)}
        {entry.active ? '*' : ''}
      </Typography>
      <Typography
        component="span"
        variant={nameVariant}
        color={podium ? 'text.primary' : 'text.secondary'}
        sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        <MuiLink
          component={RouterLink}
          to={`/players/${row.playerId}`}
          color="inherit"
          underline="hover"
          sx={{ fontWeight: podium ? 600 : 400 }}
        >
          {row.name}
        </MuiLink>
      </Typography>
    </Box>
  );
}

function LeaderCard({
  category,
  entries,
  featured = false,
}: {
  category: Category;
  entries: LeaderEntry[];
  featured?: boolean;
}) {
  const Icon = category.icon;
  return (
    <Box
      component="article"
      data-testid={`leader-${category.field}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: featured ? 2.25 : 1.75,
        borderRadius: 2,
        border: 1,
        borderColor: featured ? 'secondary.main' : 'divider',
        bgcolor: featured ? 'action.hover' : 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon size={featured ? 20 : 18} aria-hidden />
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
          {category.label}
        </Typography>
        <Chip label={category.short} size="small" variant="outlined" sx={{ ml: 'auto' }} />
      </Box>

      {entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No qualifying players yet
        </Typography>
      ) : (
        <Box
          component="ol"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: featured ? 0.75 : 0.5,
            m: 0,
            p: 0,
            listStyle: 'none',
          }}
        >
          {entries.map((entry, index) => (
            <LeaderEntryView
              key={entry.row.playerId}
              entry={entry}
              category={category}
              index={index}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

function PageHeader({
  season,
  onChange,
}: {
  season: number | 'all';
  onChange: (value: string) => void;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Typography variant="h4" component="h1">
        Leaders
      </Typography>
      <FormControl size="small" sx={{ minWidth: 160, ml: { sm: 'auto' } }}>
        <InputLabel id="leaders-season-label">Season</InputLabel>
        <Select
          labelId="leaders-season-label"
          label="Season"
          value={String(season)}
          onChange={(event) => onChange(event.target.value as string)}
        >
          <MenuItem value="all">All-time</MenuItem>
          {seasons.map((seasonFile) => (
            <MenuItem key={seasonFile.season} value={String(seasonFile.season)}>
              {seasonFile.season}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

/** Offensive leaders for the selected period: the top five in each category. */
export default function LeadersPage() {
  useDocumentTitle('Leaders');
  const [searchParams, setSearchParams] = useSearchParams();

  // All-time is the default. The season select offers every available season
  // (currently just 2026) plus All-time.
  const seasonParam = searchParams.get('season');
  const season: number | 'all' =
    seasonParam !== null &&
    seasonParam !== 'all' &&
    seasons.some((seasonFile) => String(seasonFile.season) === seasonParam)
      ? Number(seasonParam)
      : 'all';

  const filter: SeasonFilter = { season, phase: 'all' };
  const rows: LeaderRow[] = leaderboard(seasons, filter).map(({ playerId, stats }) => ({
    playerId,
    name: getPlayer(playerId)?.name ?? playerId,
    ...stats,
  }));
  // Qualification scales with the games played in whichever period is viewed.
  const teamGames = filterGames(seasons, filter).length;

  function streakEntries(field: StreakField): LeaderEntry[] {
    const byPlayer = new Map(streaksFor(seasons, filter, field).map((s) => [s.playerId, s]));
    return rankEntries(
      rows.flatMap((row) => {
        const streak = byPlayer.get(row.playerId);
        return streak && streak.longest > 0
          ? [{ row, value: streak.longest, active: streak.active }]
          : [];
      }),
    );
  }

  function changeSeason(value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('season', value);
        return next;
      },
      { preventScrollReset: true },
    );
  }

  if (rows.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <PageHeader season={season} onChange={changeSeason} />
        <Paper variant="outlined">
          <EmptyState
            icon={Trophy}
            title="No leaders yet"
            message="Leaderboards will appear once games are recorded."
          />
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <PageHeader season={season} onChange={changeSeason} />

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Crown size={22} aria-hidden />
          <Typography variant="h6" component="h2">
            The Triple Crown
          </Typography>
          <Chip label="AVG · OPS · HR" size="small" variant="outlined" sx={{ ml: 'auto' }} />
        </Box>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          }}
        >
          {TRIPLE_CROWN.map((category) => (
            <LeaderCard
              key={category.field}
              category={category}
              entries={leadersFor(rows, category.field, teamGames)}
              featured
            />
          ))}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Medal size={22} aria-hidden />
          <Typography variant="h6" component="h2">
            Honourable Mentions
          </Typography>
          <Chip label="1B · 2B · 3B · BB" size="small" variant="outlined" sx={{ ml: 'auto' }} />
        </Box>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          }}
        >
          {HONOURABLE_MENTIONS.map((category) => (
            <LeaderCard
              key={category.field}
              category={category}
              entries={leadersFor(rows, category.field, teamGames)}
            />
          ))}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Activity size={22} aria-hidden />
          <Typography variant="h6" component="h2">
            Streaks
          </Typography>
          <Chip label="HIT · OB · 0K · XBH" size="small" variant="outlined" sx={{ ml: 'auto' }} />
        </Box>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          }}
        >
          {STREAKS.map((category) => (
            <LeaderCard
              key={category.field}
              category={category}
              entries={streakEntries(category.field)}
            />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          * denotes active streak
        </Typography>
      </Paper>
    </Box>
  );
}
