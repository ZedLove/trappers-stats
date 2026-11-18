import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { latestSeason, seasons } from '../../shared/data';
import type { SeasonFilter } from '../../shared/queries';
import type { Phase } from '../../shared/schema';

const PHASES: readonly Phase[] = ['regular', 'round_robin', 'playoff'];

function isPhase(value: string): value is Phase {
  return (PHASES as readonly string[]).includes(value);
}

export interface SeasonFilterHook {
  filter: SeasonFilter;
  /** False when the user has opted to see every player, qualified or not. */
  qualified: boolean;
  setSeason: (season: number | 'all') => void;
  setPhase: (phase: 'all' | Phase) => void;
  setQualified: (qualified: boolean) => void;
}

// Reads/writes the filter via ?season=&phase=&qualified= URL params. Unknown or
// garbage values are silently replaced with defaults (latest season, 'all',
// qualified-only), never errors.
export function useSeasonFilter(): SeasonFilterHook {
  const [searchParams, setSearchParams] = useSearchParams();

  const { filter, qualified } = useMemo(() => {
    const seasonParam = searchParams.get('season');
    const phaseParam = searchParams.get('phase');

    let season: number | 'all' = latestSeason()?.season ?? 'all';
    if (seasonParam === 'all') {
      season = 'all';
    } else if (seasonParam !== null) {
      const year = Number(seasonParam);
      if (seasons.some((seasonFile) => seasonFile.season === year)) {
        season = year;
      }
    }

    const phase: 'all' | Phase =
      phaseParam !== null && isPhase(phaseParam) ? phaseParam : 'all';

    // Qualified-only is the default; ?qualified=all opts into showing everyone.
    return {
      filter: { season, phase } satisfies SeasonFilter,
      qualified: searchParams.get('qualified') !== 'all',
    };
  }, [searchParams]);

  const setParam = useCallback(
    (key: string, value: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(key, value);
          return next;
        },
        { preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  const setSeason = useCallback(
    (season: number | 'all') => setParam('season', String(season)),
    [setParam],
  );
  const setPhase = useCallback(
    (phase: 'all' | Phase) => setParam('phase', phase),
    [setParam],
  );
  const setQualified = useCallback(
    (value: boolean) => setParam('qualified', value ? 'qualified' : 'all'),
    [setParam],
  );

  return { filter, qualified, setSeason, setPhase, setQualified };
}
