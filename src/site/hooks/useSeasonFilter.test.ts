// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { createElement, type PropsWithChildren } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { latestSeason } from '../../shared/data';
import { useSeasonFilter } from './useSeasonFilter';

function wrapperWith(initialEntries: string[]) {
  return function Wrapper({ children }: PropsWithChildren) {
    return createElement(MemoryRouter, { initialEntries }, children);
  };
}

const latestYear = latestSeason()?.season;

describe('useSeasonFilter', () => {
  it('defaults to the latest season and all phases when params are absent', () => {
    const { result } = renderHook(() => useSeasonFilter(), {
      wrapper: wrapperWith(['/']),
    });

    expect(result.current.filter).toEqual({ season: latestYear, phase: 'all' });
  });

  it('parses a valid season and phase from the URL', () => {
    const { result } = renderHook(() => useSeasonFilter(), {
      wrapper: wrapperWith([`/?season=${latestYear}&phase=playoff`]),
    });

    expect(result.current.filter).toEqual({ season: latestYear, phase: 'playoff' });
  });

  it('accepts season=all', () => {
    const { result } = renderHook(() => useSeasonFilter(), {
      wrapper: wrapperWith(['/?season=all&phase=regular']),
    });

    expect(result.current.filter).toEqual({ season: 'all', phase: 'regular' });
  });

  it('replaces an unknown season and a garbage phase with defaults', () => {
    const { result } = renderHook(() => useSeasonFilter(), {
      wrapper: wrapperWith(['/?season=1999&phase=bogus']),
    });

    expect(result.current.filter).toEqual({ season: latestYear, phase: 'all' });
  });

  it('treats non-numeric season params as unknown', () => {
    const { result } = renderHook(() => useSeasonFilter(), {
      wrapper: wrapperWith(['/?season=bogus']),
    });

    expect(result.current.filter.season).toBe(latestYear);
  });

  it('writes season and phase back to the URL without clobbering each other', () => {
    const { result } = renderHook(
      () => ({ hook: useSeasonFilter(), search: useLocation().search }),
      { wrapper: wrapperWith(['/']) },
    );

    act(() => result.current.hook.setSeason('all'));
    expect(result.current.search).toContain('season=all');

    act(() => result.current.hook.setPhase('round_robin'));
    expect(result.current.search).toContain('phase=round_robin');
    expect(result.current.search).toContain('season=all');
    expect(result.current.hook.filter).toEqual({ season: 'all', phase: 'round_robin' });
  });
});
