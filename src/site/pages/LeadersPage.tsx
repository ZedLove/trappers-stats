import { Box, Chip, Link as MuiLink, Paper, Typography } from '@mui/material';
import {
  Award,
  Crown,
  Flame,
  Medal,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { getPlayer, seasons } from '../../shared/data';
import {
  type LeaderEntry,
  type LeaderField,
  type LeaderRow,
  leadersFor,
} from '../../shared/leaders';
import { filterGames, leaderboard } from '../../shared/queries';
import { formatRate } from '../../shared/stats';
import EmptyState from '../components/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface Category {
  field: LeaderField;
  label: string;
  short: string;
  rate: boolean;
  icon: LucideIcon;
}

const TRIPLE_CROWN: Category[] = [
  { field: 'avg', label: 'Batting Average', short: 'AVG', rate: true, icon: Target },
  { field: 'ops', label: 'OPS', short: 'OPS', rate: true, icon: Zap },
  { field: 'hr', label: 'Home Runs', short: 'HR', rate: false, icon: Flame },
];

const HONOURABLE_MENTIONS: Category[] = [
  { field: 'singles', label: 'Singles', short: '1B', rate: false, icon: Star },
  { field: 'doubles', label: 'Doubles', short: '2B', rate: false, icon: Medal },
  { field: 'triples', label: 'Triples', short: '3B', rate: false, icon: TrendingUp },
  { field: 'bb', label: 'Walks', short: 'BB', rate: false, icon: Award },
];

// The podium shrinks as rank increases; places four and five read as plain text.
const PODIUM_VARIANTS = { 1: 'h3', 2: 'h4', 3: 'h5' } as const;

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
  const { rank, value, row } = entry;
  const podium = rank <= 3;
  const valueVariant = podium ? PODIUM_VARIANTS[rank as 1 | 2 | 3] : 'body2';
  const nameVariant = rank === 1 ? 'subtitle1' : rank === 2 ? 'body1' : 'body2';

  return (
    <Box
      component="li"
      data-testid={`leader-${category.field}-${index + 1}`}
      sx={{ display: 'flex', alignItems: 'baseline', gap: 1, minWidth: 0 }}
    >
      <Typography
        component="span"
        data-testid={`leader-${category.field}-${index + 1}-rank`}
        variant="caption"
        color={podium ? 'secondary.main' : 'text.disabled'}
        sx={{ width: 16, flexShrink: 0, fontWeight: podium ? 700 : 400 }}
      >
        {rank}
      </Typography>
      <Typography
        component="span"
        data-testid={`leader-${category.field}-${index + 1}-value`}
        variant={valueVariant}
        color={podium ? 'secondary.main' : 'text.secondary'}
        sx={{ fontWeight: podium ? 700 : 400, lineHeight: 1.15, minWidth: 42 }}
      >
        {formatValue(category, value)}
      </Typography>
      <Typography
        component="span"
        variant={nameVariant}
        color={podium ? 'text.primary' : 'text.secondary'}
        sx={{ minWidth: 0 }}
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

/** All-time offensive leaders: the top five in each category, ranked. */
export default function LeadersPage() {
  useDocumentTitle('Leaders');

  const rows: LeaderRow[] = leaderboard(seasons, { season: 'all', phase: 'all' }).map(
    ({ playerId, stats }) => ({
      playerId,
      name: getPlayer(playerId)?.name ?? playerId,
      ...stats,
    }),
  );
  // All-time today; when a season selector is added this is the period whose
  // team-game count feeds the qualification ratio.
  const teamGames = filterGames(seasons, { season: 'all', phase: 'all' }).length;

  if (rows.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h4" component="h1">
          Leaders
        </Typography>
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
      <Box>
        <Typography variant="h4" component="h1">
          Leaders
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          All-time offensive leaders across every season.
        </Typography>
      </Box>

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
    </Box>
  );
}
