// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SeasonFile } from '../../shared/schema';

vi.mock('../../shared/data', async (importActual) => {
  const actual = await importActual<typeof import('../../shared/data')>();
  const fixtureSeasons: SeasonFile[] = [
    {
      season: 2025,
      division: 'A',
      games: [
        {
          id: 'mismatch-game',
          date: '2025-05-06',
          phase: 'regular',
          opponentId: 'hornets',
          locationId: 'doverfield-park',
          score: { us: 5, them: 3 },
          lines: [
            {
              playerId: 'z-man',
              ab: 1,
              '1b': 1,
              '2b': 0,
              '3b': 0,
              hr: 0,
              bb: 0,
              sf: 0,
              k: 0,
              r: 10,
            },
          ],
        },
        {
          id: 'clean-game',
          date: '2025-05-07',
          phase: 'regular',
          opponentId: 'hornets',
          score: { us: 1, them: 2 },
          lines: [
            {
              playerId: 'z-man',
              ab: 1,
              '1b': 1,
              '2b': 0,
              '3b': 0,
              hr: 0,
              bb: 0,
              sf: 0,
              k: 0,
              r: 1,
            },
            { playerId: 'stretch', ab: 0, '1b': 0, '2b': 0, '3b': 0, hr: 0, bb: 0, sf: 0, k: 0, r: 0 },
            { playerId: 'duke', ab: 0, '1b': 0, '2b': 0, '3b': 0, hr: 0, bb: 0, sf: 0, k: 0, r: 0 },
            { playerId: 'mike-s', ab: 0, '1b': 0, '2b': 0, '3b': 0, hr: 0, bb: 0, sf: 0, k: 0, r: 0 },
            { playerId: 'big-cat', ab: 0, '1b': 0, '2b': 0, '3b': 0, hr: 0, bb: 0, sf: 0, k: 0, r: 0 },
          ],
        },
      ],
    },
  ];
  const seasons = [...actual.seasons, ...fixtureSeasons].sort((a, b) => a.season - b.season);
  return {
    ...actual,
    seasons,
    getSeason: (year: number) => seasons.find((season) => season.season === year),
    getPlayer: actual.getPlayer,
    getTeam: actual.getTeam,
  };
});

afterEach(cleanup);

function renderPage(gameId: string) {
  return render(
    <MemoryRouter initialEntries={[`/games/${gameId}`]}>
      <Routes>
        <Route path="/games/:gameId" element={<BoxScorePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

import BoxScorePage from './BoxScorePage';

describe('BoxScorePage', () => {
  it('renders header for a seed game', () => {
    renderPage('2026-05-05-hornets');
    expect(screen.getByRole('heading', { name: 'Box Score' })).toBeInTheDocument();
    expect(screen.getByText('2026-05-05')).toBeInTheDocument();
    expect(screen.getByText('Hornets')).toBeInTheDocument();
    expect(screen.getByText('Doverfield Park')).toBeInTheDocument();
    expect(screen.getByText('7-5')).toBeInTheDocument();
    // phase badge
    expect(screen.getByText('Regular Season')).toBeInTheDocument();
    // result badge W
    expect(screen.getByText('W')).toBeInTheDocument();
  });

  it('renders every line row player link and counts', () => {
    renderPage('2026-05-05-hornets');
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows.length).toBe(6);
    // first row z-man
    const first = rows[0];
    const link = within(first).getByRole('link');
    expect(link).toHaveAttribute('href', '/players/z-man');
    expect(link).toHaveTextContent('Z-Man');
    // counts: AB H 1B 2B 3B HR BB SF K R
    const cells = within(first).getAllByRole('cell').map((c) => c.textContent);
    // Player cell + 10 stat cells
    expect(cells).toContain('4'); // ab
  });

  it('renders incomplete-data caption on runs-mismatch fixture', () => {
    renderPage('mismatch-game');
    expect(screen.getByText(/incomplete/i)).toBeInTheDocument();
  });

  it('does not render incomplete-data caption on clean game', () => {
    renderPage('clean-game');
    expect(screen.queryByText(/incomplete/i)).not.toBeInTheDocument();
  });

  it('renders NotFound on unknown game id', () => {
    renderPage('no-such-game');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});
