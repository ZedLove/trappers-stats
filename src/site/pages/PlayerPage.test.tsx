// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PlayerPage from './PlayerPage';

// Self-contained fixture dataset for one player across three games (regular,
// round-robin, playoff) so the career/season/game-log tables are deterministic
// without depending on data/seasons/*.json.
vi.mock('../../shared/data', async () => {
  const { makeGame, makeLine, makePlayer, makeSeason, makeTeam } = await import(
    '../../fixtures/fixtures'
  );
  const players = [makePlayer({ id: 'z-man', name: 'Z-Man' })];
  const teams = [
    makeTeam({ id: 'trappers', name: 'Trappers', us: true }),
    makeTeam({ id: 'hornets', name: 'Hornets' }),
    makeTeam({ id: 'bandits', name: 'Bandits' }),
    makeTeam({ id: 'wildcats', name: 'Wildcats' }),
  ];
  const seasons = [
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
          score: { us: 7, them: 5 },
          lines: [makeLine({ playerId: 'z-man', ab: 4, '1b': 2, r: 2 })],
        }),
        makeGame({
          id: '2026-06-02-bandits',
          date: '2026-06-02',
          phase: 'round_robin',
          opponentId: 'bandits',
          isHome: false,
          score: { us: 5, them: 4 },
          lines: [makeLine({ playerId: 'z-man', ab: 3, '1b': 1, bb: 1, r: 1 })],
        }),
        makeGame({
          id: '2026-06-23-wildcats',
          date: '2026-06-23',
          phase: 'playoff',
          opponentId: 'wildcats',
          isHome: true,
          score: { us: 6, them: 5 },
          lines: [makeLine({ playerId: 'z-man', ab: 4, '1b': 1, '2b': 1, r: 2 })],
        }),
      ],
    }),
  ];
  return {
    players,
    teams,
    locations: [],
    seasons,
    getPlayer: (id: string) => players.find((player) => player.id === id),
    getTeam: (id: string) => teams.find((team) => team.id === id),
    getLocation: () => undefined,
    getUsTeamName: () => teams.find((team) => team.us === true)?.name ?? 'Trappers',
    getSeason: (year: number) => seasons.find((season) => season.season === year),
    latestSeason: () => seasons.at(-1),
  };
});

afterEach(cleanup);

function renderPage(playerId: string) {
  return render(
    <MemoryRouter initialEntries={[`/players/${playerId}`]}>
      <Routes>
        <Route path="/players/:playerId" element={<PlayerPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function getTable(name: string): HTMLElement {
  return screen.getByRole('table', { name });
}

function headerTexts(table: HTMLElement): string[] {
  return within(table)
    .getAllByRole('columnheader')
    .map((header) => header.textContent ?? '');
}

function bodyRowTexts(table: HTMLElement): string[][] {
  return within(table)
    .getAllByRole('row')
    .slice(1) // drop the header row
    .map((row) => within(row).getAllByRole('cell').map((cell) => cell.textContent ?? ''));
}

// Z-Man's career line, hand-computed from the fixture games:
// G=3 PA=12 AB=11 R=5 H=5 1B=4 2B=1 3B=0 HR=0 BB=1 K=0 -> .455/.500/.545/1.045
const Z_MAN_CAREER = [
  '3',
  '12',
  '11',
  '5',
  '5',
  '4',
  '1',
  '0',
  '0',
  '1',
  '0',
  '.455',
  '.500',
  '.545',
  '1.045',
];

describe('PlayerPage', () => {
  it('renders the player display name and section headings', () => {
    renderPage('z-man');
    expect(screen.getByRole('heading', { name: 'Z-Man' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Career' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Season by season' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Game log' })).toBeInTheDocument();
  });

  it('renders the career line derived from all game-log lines', () => {
    renderPage('z-man');
    const career = getTable('Career');
    expect(headerTexts(career)).toEqual([
      'G',
      'PA',
      'AB',
      'R',
      'H',
      '1B',
      '2B',
      '3B',
      'HR',
      'BB',
      'K',
      'AVG',
      'OBP',
      'SLG',
      'OPS',
    ]);
    expect(bodyRowTexts(career)).toEqual([Z_MAN_CAREER]);
  });

  it('renders one row per season with that season’s totals', () => {
    renderPage('z-man');
    const bySeason = getTable('Season by season');
    expect(headerTexts(bySeason)[0]).toBe('Season');
    expect(bodyRowTexts(bySeason)).toEqual([['2026', ...Z_MAN_CAREER]]);
  });

  it('renders the game log newest-first with opponent links, phase chips, and raw lines', () => {
    renderPage('z-man');
    const log = getTable('Game log');
    expect(headerTexts(log)).toEqual([
      'Date',
      'Opponent',
      'Phase',
      'AB',
      'H',
      '1B',
      '2B',
      '3B',
      'HR',
      'BB',
      'SF',
      'K',
      'R',
    ]);
    expect(bodyRowTexts(log)).toEqual([
      ['2026-06-23', 'Wildcats', 'Playoffs', '4', '2', '1', '1', '0', '0', '0', '0', '0', '2'],
      ['2026-06-02', 'Bandits', 'Round Robin', '3', '1', '1', '0', '0', '0', '1', '0', '0', '1'],
      ['2026-05-05', 'Hornets', 'Regular Season', '4', '2', '2', '0', '0', '0', '0', '0', '0', '2'],
    ]);

    const links = within(log).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/games/2026-06-23-wildcats',
      '/games/2026-06-02-bandits',
      '/games/2026-05-05-hornets',
    ]);
  });

  it('renders NotFound for an unknown playerId', () => {
    renderPage('nobody');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
