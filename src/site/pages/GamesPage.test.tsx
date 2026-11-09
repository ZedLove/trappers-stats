// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Player } from '../../shared/schema';
import GamesPage from './GamesPage';

// Self-contained fixture dataset. 2026 is a full season with standings and
// playoffs; 2025 has a game but no results (standings/playoffs must hide);
// 2024 has no games at all (empty state).
vi.mock('../../shared/data', async () => {
  const {
    makeGame,
    makeLocation,
    makePlayoffMatchup,
    makeResults,
    makeSeason,
    makeStanding,
    makeTeam,
  } = await import('../../fixtures/fixtures');

  const teams = [
    makeTeam({ id: 'trappers', name: 'Trappers', us: true }),
    makeTeam({ id: 'hornets', name: 'Hornets' }),
    makeTeam({ id: 'bandits', name: 'Bandits' }),
    makeTeam({ id: 'wildcats', name: 'Wildcats' }),
  ];
  const locations = [
    makeLocation({ id: 'doverfield-park', name: 'Doverfield Park' }),
    makeLocation({ id: 'riverbend-field', name: 'Riverbend Field' }),
  ];
  const players: Player[] = [];
  const seasons = [
    makeSeason({ season: 2024, division: null, games: [] }),
    makeSeason({
      season: 2025,
      division: 'A',
      games: [
        makeGame({
          id: '2025-05-06-hornets',
          date: '2025-05-06',
          phase: 'regular',
          opponentId: 'hornets',
          isHome: true,
          score: { us: 3, them: 3 },
          lines: [],
        }),
      ],
    }),
    makeSeason({
      season: 2026,
      division: 'B',
      games: [
        makeGame({
          id: '2026-05-05-hornets',
          date: '2026-05-05',
          phase: 'regular',
          opponentId: 'hornets',
          isHome: true,
          locationId: 'doverfield-park',
          score: { us: 7, them: 5 },
          lines: [],
        }),
        makeGame({
          id: '2026-06-02-bandits',
          date: '2026-06-02',
          phase: 'round_robin',
          opponentId: 'bandits',
          isHome: false,
          locationId: 'riverbend-field',
          score: { us: 5, them: 9 },
          lines: [],
        }),
        makeGame({
          id: '2026-06-23-wildcats',
          date: '2026-06-23',
          phase: 'playoff',
          opponentId: 'wildcats',
          isHome: true,
          locationId: 'doverfield-park',
          score: { us: 6, them: 4 },
          lines: [],
        }),
      ],
      results: makeResults({
        standings: [
          makeStanding({ teamId: 'bandits', wins: 10, losses: 2, ties: 0 }),
          makeStanding({ teamId: 'trappers', wins: 9, losses: 3, ties: 0 }),
          makeStanding({ teamId: 'hornets', wins: 5, losses: 7, ties: 0 }),
          makeStanding({ teamId: 'wildcats', wins: 4, losses: 8, ties: 0 }),
        ],
        playoffs: [
          makePlayoffMatchup({
            round: 'Semifinal',
            division: 'B',
            teamA: 'trappers',
            teamB: 'wildcats',
            winner: 'trappers',
            note: 'Won 6-4',
          }),
          makePlayoffMatchup({
            round: 'Final',
            division: 'B',
            teamA: 'bandits',
            teamB: 'trappers',
            winner: 'bandits',
          }),
        ],
      }),
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

function renderPage(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/games" element={<GamesPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function gamesRows(): HTMLElement[] {
  return within(screen.getByRole('table', { name: 'Games' })).getAllByRole('row').slice(1);
}

describe('GamesPage', () => {
  it('renders the summary line with record, division, and finishing position', () => {
    renderPage('/games?season=2026');
    expect(screen.getByRole('heading', { name: 'Games', level: 1 })).toBeInTheDocument();
    const summary = screen.getByText(/Record: 2-1-0/);
    expect(summary).toHaveTextContent('Division B');
    expect(summary).toHaveTextContent('Finished 2nd');
  });

  it('renders standings in seed order and highlights only our team', () => {
    renderPage('/games?season=2026');
    const standings = screen.getByRole('table', { name: 'Standings' });
    const rows = within(standings).getAllByRole('row').slice(1);
    const bodyRows = rows.map((row) =>
      within(row).getAllByRole('cell').map((cell) => cell.textContent),
    );
    expect(bodyRows).toEqual([
      ['1', 'Bandits', '10', '2', '0'],
      ['2', 'Trappers', '9', '3', '0'],
      ['3', 'Hornets', '5', '7', '0'],
      ['4', 'Wildcats', '4', '8', '0'],
    ]);
    expect(rows[1]).toHaveClass('Mui-selected');
    for (const index of [0, 2, 3]) {
      expect(rows[index]).not.toHaveClass('Mui-selected');
    }
  });

  it('renders playoff results with resolved team names', () => {
    renderPage('/games?season=2026');
    const playoffs = screen.getByRole('table', { name: 'Playoff results' });
    const bodyRows = within(playoffs)
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent));
    expect(bodyRows).toEqual([
      ['Semifinal', 'Trappers vs Wildcats', 'Trappers', 'Won 6-4'],
      ['Final', 'Bandits vs Trappers', 'Bandits', '—'],
    ]);
  });

  it('lists games newest-first, each row linking to its box score', () => {
    renderPage('/games?season=2026');
    const rows = gamesRows();
    expect(rows.map((row) => within(row).getByRole('link').getAttribute('href'))).toEqual([
      '/games/2026-06-23-wildcats',
      '/games/2026-06-02-bandits',
      '/games/2026-05-05-hornets',
    ]);

    const [playoff, roundRobin, regular] = rows;
    for (const text of ['2026-06-23', 'Wildcats', 'Playoffs', 'W', '6-4', 'Doverfield Park']) {
      expect(within(playoff).getByText(text)).toBeInTheDocument();
    }
    for (const text of ['2026-06-02', 'Bandits', 'Round Robin', 'L', '5-9', 'Riverbend Field']) {
      expect(within(roundRobin).getByText(text)).toBeInTheDocument();
    }
    for (const text of ['2026-05-05', 'Hornets', 'Regular Season', 'W', '7-5']) {
      expect(within(regular).getByText(text)).toBeInTheDocument();
    }
  });

  it('narrows the games list by the phase URL param without touching the summary', () => {
    renderPage('/games?season=2026&phase=playoff');
    const rows = gamesRows();
    expect(rows).toHaveLength(1);
    expect(within(rows[0]).getByRole('link')).toHaveAttribute('href', '/games/2026-06-23-wildcats');
    expect(screen.getByText(/Record: 2-1-0/)).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Standings' })).toBeInTheDocument();
  });

  it('hides standings and playoffs for a season without results', () => {
    renderPage('/games?season=2025');
    const summary = screen.getByText(/Record: 0-0-1/);
    expect(summary).toHaveTextContent('Division A');
    expect(summary).not.toHaveTextContent('Finished');
    expect(screen.queryByRole('table', { name: 'Standings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Playoff results' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Standings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Playoffs' })).not.toBeInTheDocument();

    const rows = gamesRows();
    expect(rows.map((row) => within(row).getByRole('link').getAttribute('href'))).toEqual([
      '/games/2025-05-06-hornets',
    ]);
    expect(within(rows[0]).getByText('T')).toBeInTheDocument();
    expect(within(rows[0]).getByText('3-3')).toBeInTheDocument();
  });

  it('shows an empty-state message instead of the list for a season with no games', () => {
    renderPage('/games?season=2024');
    expect(screen.getByText(/no games yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('table', { name: 'Games' })).not.toBeInTheDocument();
  });

  it('defaults to the latest season when no season param is given', () => {
    renderPage('/games');
    expect(screen.getByText(/Record: 2-1-0/)).toBeInTheDocument();
  });

  it('falls back to the latest season when the URL says season=all', () => {
    renderPage('/games?season=all');
    expect(screen.getByRole('combobox', { name: 'Season' })).toHaveTextContent('2026');
    expect(screen.getByText(/Record: 2-1-0/)).toBeInTheDocument();
  });
});
