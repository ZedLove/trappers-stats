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
import { type LeaderField, type LeaderResult, type LeaderRow, leadersFor } from '../../shared/leaders';
import { leaderboard } from '../../shared/queries';
import { formatRate } from '../../shared/stats';
import EmptyState from '../components/EmptyState';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

interface Category {
  field: LeaderField;
  label: string;
  /** Short stat abbreviation shown alongside the headline value. */
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

function formatValue(category: Category, value: number | null): string {
  if (value === null) return '—';
  return category.rate ? formatRate(value) : String(value);
}

function LeaderCard({
  category,
  result,
  featured = false,
}: {
  category: Category;
  result: LeaderResult;
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
        gap: 1,
        p: featured ? 2.25 : 1.75,
        borderRadius: 2,
        border: 1,
        borderColor: featured ? 'secondary.main' : 'divider',
        bgcolor: featured ? 'action.hover' : 'background.paper',
        minHeight: featured ? 160 : undefined,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon size={featured ? 20 : 18} aria-hidden />
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1 }}>
          {category.label}
        </Typography>
        <Chip label={category.short} size="small" variant="outlined" sx={{ ml: 'auto' }} />
      </Box>

      {result.value === null ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
          No qualifying players yet
        </Typography>
      ) : (
        <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Typography
            component="p"
            variant={featured ? 'h3' : 'h5'}
            color="secondary.main"
            sx={{ fontWeight: 700, lineHeight: 1, m: 0 }}
          >
            {formatValue(category, result.value)}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            {result.leaders.map((leader, index) => (
              <span key={leader.playerId}>
                {index > 0 && ', '}
                <MuiLink
                  component={RouterLink}
                  to={`/players/${leader.playerId}`}
                  color="secondary"
                  underline="hover"
                >
                  {leader.name}
                </MuiLink>
              </span>
            ))}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

/** All-time offensive leaders, grouped into the triple crown and honourable mentions. */
export default function LeadersPage() {
  useDocumentTitle('Leaders');

  const rows: LeaderRow[] = leaderboard(seasons, { season: 'all', phase: 'all' }).map(
    ({ playerId, stats }) => ({
      playerId,
      name: getPlayer(playerId)?.name ?? playerId,
      ...stats,
    }),
  );

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
          <Chip
            label="Batting Average · OPS · Home Runs"
            size="small"
            variant="outlined"
            sx={{ ml: 'auto', display: { xs: 'none', sm: 'inline-flex' } }}
          />
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
              result={leadersFor(rows, category.field)}
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
          <Chip
            label="Singles · Doubles · Triples · Walks"
            size="small"
            variant="outlined"
            sx={{ ml: 'auto', display: { xs: 'none', sm: 'inline-flex' } }}
          />
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
              result={leadersFor(rows, category.field)}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
