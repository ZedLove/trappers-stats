import { Box, Typography } from '@mui/material';
import { CalendarOff, type LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  /** Optional icon override; defaults to a calendar (nothing scheduled yet). */
  icon?: LucideIcon;
  /** Short, friendly headline. */
  title: string;
  /** Optional supporting line of copy. */
  message?: string;
}

/**
 * Centered, muted empty state used wherever a table or grid has nothing to
 * show. A subtle Lucide glyph plus a short friendly line replaces the bare
 * "No games entered yet" text.
 */
export default function EmptyState({ icon: Icon = CalendarOff, title, message }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        py: 4,
        textAlign: 'center',
        color: 'text.secondary',
      }}
    >
      <Icon size={36} strokeWidth={1.5} aria-hidden />
      <Typography variant="body1" color="text.secondary">
        {title}
      </Typography>
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
}
