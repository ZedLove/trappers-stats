import type { Phase } from '../shared/schema';

/** Human-readable label for each season phase. */
export const PHASE_LABELS: Record<Phase, string> = {
  regular: 'Regular Season',
  round_robin: 'Round Robin',
  playoff: 'Playoffs',
};

/**
 * MUI `Chip` color for each phase, so phases read distinctly in both light and
 * dark mode: `regular` → secondary (teal), `round_robin` → warning (amber),
 * `playoff` → info (blue).
 */
const PHASE_COLORS: Record<Phase, 'secondary' | 'warning' | 'info'> = {
  regular: 'secondary',
  round_robin: 'warning',
  playoff: 'info',
};

export function phaseColor(phase: Phase): 'secondary' | 'warning' | 'info' {
  return PHASE_COLORS[phase];
}
