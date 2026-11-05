// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import type { PlayerLine } from '../../shared/schema';
import { deriveStats, sumLines } from '../../shared/stats';
import StatsPage from '../pages/StatsPage';
import SeasonPhaseControls from './SeasonPhaseControls';
import StatsGrid from './StatsGrid';

afterEach(cleanup);

function makeLine(playerId: string, overrides: Partial<PlayerLine> = {}): PlayerLine {
  return {
    playerId,
    ab: 0,
    '1b': 0,
    '2b': 0,
    '3b': 0,
    hr: 0,
    bb: 0,
    sf: 0,
    k: 0,
    r: 0,
    ...overrides,
  };
}

function makeRow(playerId: string, games: Array<Partial<PlayerLine>>) {
  return {
    playerId,
    stats: deriveStats(sumLines(games.map((game) => makeLine(playerId, game)))),
  };
}

// Intentionally scrambled: the grid must apply the AVG-desc default order itself.
const FIXTURE_ROWS = [
  makeRow('jo-jo', [{ bb: 1 }]), // no at-bats -> null rates
  makeRow('z-man', [{ ab: 3, '1b': 1 }]), // .333 AVG
  makeRow('stretch', [{ ab: 4, '1b': 1, hr: 1 }]), // .500 AVG, 1.250 SLG
];

function renderGrid(rows = FIXTURE_ROWS) {
  return render(
    <MemoryRouter>
      <StatsGrid rows={rows} />
    </MemoryRouter>,
  );
}

function playerRow(name: string): HTMLElement {
  const row = screen.getByRole('link', { name }).closest('[role="row"]');
  expect(row).not.toBeNull();
  return row as HTMLElement;
}

function cellText(row: HTMLElement, field: string): string {
  const cell = row.querySelector(`[data-field="${field}"]`);
  expect(cell).not.toBeNull();
  return cell?.textContent ?? '';
}

describe('StatsGrid', () => {
  it('renders the columns in spec order', () => {
    renderGrid();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Player',
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
  });

  it('formats rate stats and shows counting stats raw', () => {
    renderGrid();
    const zMan = playerRow('Z-Man');
    expect(cellText(zMan, 'g')).toBe('1');
    expect(cellText(zMan, 'ab')).toBe('3');
    expect(cellText(zMan, 'avg')).toBe('.333');
    const stretch = playerRow('Stretch');
    expect(cellText(stretch, 'slg')).toBe('1.250');
    expect(cellText(stretch, 'ops')).toBe('1.750');
  });

  it('renders an em dash for null rates', () => {
    renderGrid();
    const joJo = playerRow('Jo Jo');
    expect(cellText(joJo, 'avg')).toBe('—');
    expect(cellText(joJo, 'slg')).toBe('—');
    expect(cellText(joJo, 'ops')).toBe('—');
    expect(cellText(joJo, 'obp')).toBe('1.000');
  });

  it('sorts by AVG descending by default (nulls last) and links player names', () => {
    renderGrid();
    expect(screen.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/players/stretch',
      '/players/z-man',
      '/players/jo-jo',
    ]);
  });

  it('shows a friendly message for an empty season instead of crashing', () => {
    renderGrid([]);
    expect(screen.getByText(/no games entered yet/i)).toBeInTheDocument();
  });
});

function SearchProbe() {
  const location = useLocation();
  return <output data-testid="search">{location.search}</output>;
}

describe('SeasonPhaseControls', () => {
  it('offers every season plus an All-time option by default', () => {
    render(
      <MemoryRouter>
        <SeasonPhaseControls />
      </MemoryRouter>,
    );
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Season' }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      '2026',
      'All-time',
    ]);
  });

  it('omits the All-time option when showAllTime is false', () => {
    render(
      <MemoryRouter>
        <SeasonPhaseControls showAllTime={false} />
      </MemoryRouter>,
    );
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Season' }));
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['2026']);
  });

  it('writes phase changes to the URL', () => {
    render(
      <MemoryRouter>
        <SeasonPhaseControls />
        <SearchProbe />
      </MemoryRouter>,
    );
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Phase' }));
    fireEvent.click(screen.getByRole('option', { name: 'Regular Season' }));
    expect(screen.getByTestId('search')).toHaveTextContent('phase=regular');
  });
});

function renderPage(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <StatsPage />
    </MemoryRouter>,
  );
}

describe('StatsPage', () => {
  it('renders the latest-season leaderboard by default', () => {
    renderPage(['/']);
    expect(screen.getByRole('combobox', { name: 'Season' })).toHaveTextContent('2026');
    expect(screen.getByRole('combobox', { name: 'Phase' })).toHaveTextContent('All');
    const zMan = playerRow('Z-Man');
    expect(cellText(zMan, 'g')).toBe('3');
    expect(cellText(zMan, 'avg')).toBe('.455');
  });

  it('filters the leaderboard by the phase URL param', () => {
    renderPage(['/?phase=regular']);
    expect(cellText(playerRow('Z-Man'), 'avg')).toBe('.500');
    expect(screen.queryByText('.455')).not.toBeInTheDocument();
  });

  it('accepts season=all from the URL', () => {
    renderPage(['/?season=all']);
    expect(cellText(playerRow('Z-Man'), 'avg')).toBe('.455');
  });
});
