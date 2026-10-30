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
  setSeason: (season: number | 'all') => void;
  setPhase: (phase: 'all' | Phase) => void;
}

// Reads/writes the filter via ?season=&phase= URL params. Unknown or garbage
// values are silently replaced with defaults (latest season, 'all'), never errors.
export function useSeasonFilter(): SeasonFilterHook {
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = useMemo<SeasonFilter>(() => {
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

    return { season, phase };
  }, [searchParams]);

  const setSeason = useCallback(
    (season: number | 'all') => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('season', String(season));
          return next;
        },
        { preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  const setPhase = useCallback(
    (phase: 'all' | Phase) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('phase', phase);
          return next;
        },
        { preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  return { filter, setSeason, setPhase };
}
