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
          isHome: true,
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
          isHome: false,
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
        {
          id: 'linescore-home',
          date: '2025-05-08',
          phase: 'regular',
          opponentId: 'hornets',
          isHome: true,
          score: { us: 7, them: 5 },
          opponentHits: 9,
          innings: [
            { us: 1, them: 0 },
            { us: 2, them: 2 },
            { us: 4, them: 3 },
          ],
          lines: [
            { playerId: 'z-man', ab: 4, '1b': 2, '2b': 1, '3b': 0, hr: 0, bb: 0, sf: 0, k: 1, r: 3 },
            { playerId: 'stretch', ab: 5, '1b': 1, '2b': 2, '3b': 1, hr: 1, bb: 0, sf: 0, k: 0, r: 4 },
          ],
        },
        {
          id: 'linescore-away',
          date: '2025-05-09',
          phase: 'regular',
          opponentId: 'hornets',
          isHome: false,
          score: { us: 6, them: 4 },
          innings: [
            { us: 3, them: 2 },
            { us: 3, them: 2 },
          ],
          lines: [
            { playerId: 'z-man', ab: 4, '1b': 3, '2b': 1, '3b': 0, hr: 0, bb: 0, sf: 0, k: 0, r: 3 },
            { playerId: 'stretch', ab: 5, '1b': 2, '2b': 2, '3b': 1, hr: 0, bb: 0, sf: 0, k: 0, r: 3 },
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
    expect(screen.getByRole('heading', { name: 'Hornets @ Trappers' })).toBeInTheDocument();
    expect(screen.getByText('Doverfield Park')).toBeInTheDocument();
    expect(screen.getByText('7-5')).toBeInTheDocument();
    // phase badge
    expect(screen.getByText('Regular Season')).toBeInTheDocument();
    // result badge W
    expect(screen.getByText('W')).toBeInTheDocument();
  });

  it('renders "<opponent> @ Trappers" when the Trappers are home', () => {
    renderPage('linescore-home');
    expect(screen.getByRole('heading', { name: 'Hornets @ Trappers' })).toBeInTheDocument();
  });

  it('renders "Trappers @ <opponent>" when the Trappers are away', () => {
    renderPage('clean-game');
    expect(screen.getByRole('heading', { name: 'Trappers @ Hornets' })).toBeInTheDocument();
  });

  it('renders a linescore with inning columns and R/H totals when home', () => {
    renderPage('linescore-home');
    const table = screen.getByRole('table', { name: 'Linescore' });
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((cell) => cell.textContent);
    expect(headers).toEqual(['Team', '1', '2', '3', 'R', 'H']);

    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    const awayCells = within(rows[0]).getAllByRole('cell').map((cell) => cell.textContent);
    expect(awayCells).toEqual(['Hornets', '0', '2', '3', '5', '9']);
    const homeCells = within(rows[1]).getAllByRole('cell').map((cell) => cell.textContent);
    expect(homeCells).toEqual(['Trappers', '1', '2', '4', '7', '8']);
  });

  it('renders a linescore with away/home mapping when away, em dash for missing opponent hits', () => {
    renderPage('linescore-away');
    const table = screen.getByRole('table', { name: 'Linescore' });
    const rows = within(table).getAllByRole('row').slice(1);
    const awayCells = within(rows[0]).getAllByRole('cell').map((cell) => cell.textContent);
    expect(awayCells).toEqual(['Trappers', '3', '3', '6', '9']);
    const homeCells = within(rows[1]).getAllByRole('cell').map((cell) => cell.textContent);
    expect(homeCells).toEqual(['Hornets', '2', '2', '4', '—']);
  });

  it('renders no linescore when innings are absent', () => {
    renderPage('clean-game');
    expect(screen.queryByRole('table', { name: 'Linescore' })).not.toBeInTheDocument();
  });

  it('renders every line row player link and counts', () => {
    renderPage('2026-05-05-hornets');
    const table = screen.getByRole('table', { name: 'Box score' });
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
