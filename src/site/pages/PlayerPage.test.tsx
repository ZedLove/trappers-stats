// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import PlayerPage from './PlayerPage';

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

// Z-Man's seed line, hand-computed from data/seasons/2026.json:
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
