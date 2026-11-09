// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import BoxScorePage from './BoxScorePage';

// Self-contained fixture dataset covering the box-score scenarios: a full home
// game with linescore, home/away matchup naming, missing opponent hits, a game
// with no innings, a runs-mismatch warning, and an unknown id.
vi.mock('../../shared/data', async () => {
  const {
    makeGame,
    makeLine,
    makeLocation,
    makePlayer,
    makeSeason,
    makeTeam,
  } = await import('../../fixtures/fixtures');

  const players = [
    makePlayer({ id: 'z-man', name: 'Z-Man' }),
    makePlayer({ id: 'stretch', name: 'Stretch' }),
    makePlayer({ id: 'duke', name: 'Duke' }),
    makePlayer({ id: 'mike-s', name: 'Mike S.' }),
    makePlayer({ id: 'big-cat', name: 'Big Cat' }),
    makePlayer({ id: 'jo-jo', name: 'Jo Jo' }),
  ];
  const teams = [
    makeTeam({ id: 'trappers', name: 'Trappers', us: true }),
    makeTeam({ id: 'hornets', name: 'Hornets' }),
    makeTeam({ id: 'bandits', name: 'Bandits' }),
    makeTeam({ id: 'wildcats', name: 'Wildcats' }),
  ];
  const locations = [
    makeLocation({ id: 'doverfield-park', name: 'Doverfield Park' }),
    makeLocation({ id: 'riverbend-field', name: 'Riverbend Field' }),
    makeLocation({ id: 'cedar-grove', name: 'Cedar Grove Park' }),
  ];

  const seasons = [
    makeSeason({
      season: 2026,
      division: 'B',
      games: [
        // Home regular-season game with a full linescore and a full batting order.
        makeGame({
          id: '2026-05-05-hornets',
          date: '2026-05-05',
          phase: 'regular',
          opponentId: 'hornets',
          isHome: true,
          locationId: 'doverfield-park',
          score: { us: 7, them: 5 },
          opponentHits: 9,
          innings: [
            { us: 1, them: 0 },
            { us: 0, them: 2 },
            { us: 2, them: 0 },
            { us: 0, them: 1 },
            { us: 1, them: 0 },
            { us: 0, them: 0 },
            { us: 3, them: 2 },
            { us: 0, them: 0 },
            { us: 0, them: 0 },
          ],
          lines: [
            makeLine({ playerId: 'z-man', ab: 4, '1b': 2, r: 2 }),
            makeLine({ playerId: 'stretch', ab: 3, '1b': 1, '2b': 1, bb: 1, k: 1, r: 1 }),
            makeLine({ playerId: 'duke', ab: 4, '2b': 1, hr: 1, k: 1, r: 2 }),
            makeLine({ playerId: 'mike-s', ab: 3, '1b': 1, bb: 1, r: 1 }),
            makeLine({ playerId: 'big-cat', ab: 3, sf: 1, k: 1 }),
            makeLine({ playerId: 'jo-jo', ab: 2, '1b': 1, bb: 1, k: 1, r: 1 }),
          ],
        }),
        // Player-line runs don't match the team score -> incomplete-data caption.
        makeGame({
          id: 'mismatch-game',
          date: '2025-05-06',
          phase: 'regular',
          opponentId: 'hornets',
          isHome: true,
          locationId: 'doverfield-park',
          score: { us: 5, them: 3 },
          lines: [makeLine({ playerId: 'z-man', ab: 1, '1b': 1, r: 10 })],
        }),
        // Away game with no innings: no linescore and no warnings.
        makeGame({
          id: 'clean-game',
          date: '2025-05-07',
          phase: 'regular',
          opponentId: 'hornets',
          isHome: false,
          score: { us: 1, them: 2 },
          lines: [
            makeLine({ playerId: 'z-man', ab: 1, '1b': 1, r: 1 }),
            makeLine({ playerId: 'stretch' }),
            makeLine({ playerId: 'duke' }),
            makeLine({ playerId: 'mike-s' }),
            makeLine({ playerId: 'big-cat' }),
          ],
        }),
        // Home game with a 3-inning linescore and opponent hits.
        makeGame({
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
            makeLine({ playerId: 'z-man', ab: 4, '1b': 2, '2b': 1, r: 3 }),
            makeLine({ playerId: 'stretch', ab: 5, '1b': 1, '2b': 2, '3b': 1, hr: 1, r: 4 }),
          ],
        }),
        // Away game with a 2-inning linescore and no opponent hits.
        makeGame({
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
            makeLine({ playerId: 'z-man', ab: 4, '1b': 3, '2b': 1, r: 3 }),
            makeLine({ playerId: 'stretch', ab: 5, '1b': 2, '2b': 2, '3b': 1, r: 3 }),
          ],
        }),
      ],
    }),
  ];

  return {
    players,
    teams,
    locations,
    seasons,
    getPlayer: (id: string) => players.find((player) => player.id === id),
    getTeam: (id: string) => teams.find((team) => team.id === id),
    getLocation: (id: string | undefined) => locations.find((location) => location.id === id),
    getUsTeamName: () => teams.find((team) => team.us === true)?.name ?? 'Trappers',
    getSeason: (year: number) => seasons.find((season) => season.season === year),
    latestSeason: () => seasons.at(-1),
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

describe('BoxScorePage', () => {
  it('renders header for a full home game', () => {
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
