// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import StatsCards, { type PlayerStatRow } from './StatsCards';

afterEach(cleanup);

function row(overrides: Partial<PlayerStatRow> & { playerId: string; name: string }): PlayerStatRow {
  return {
    g: 10,
    pa: 40,
    ab: 35,
    r: 10,
    h: 20,
    singles: 12,
    doubles: 2,
    triples: 1,
    hr: 5,
    tb: 50,
    bb: 8,
    sf: 0,
    k: 4,
    avg: 0.3,
    obp: 0.4,
    slg: 0.5,
    ops: 0.9,
    ...overrides,
  };
}

const ROWS: PlayerStatRow[] = [
  row({ playerId: 'a', name: 'Alpha', avg: 0.3, hr: 5, ops: 0.9, g: 10 }),
  row({ playerId: 'b', name: 'Beta', avg: 0.25, hr: 7, ops: 0.8, g: 12 }),
];

function renderCards(rows: PlayerStatRow[] = ROWS) {
  return render(
    <MemoryRouter>
      <StatsCards rows={rows} />
    </MemoryRouter>,
  );
}

function cardNames(): string[] {
  return screen
    .getAllByRole('listitem')
    .map((li) => within(li).getByRole('link').textContent ?? '');
}

describe('StatsCards', () => {
  it('renders a card per player in the default AVG-desc order', () => {
    renderCards();
    expect(cardNames()).toEqual(['Alpha', 'Beta']);
    expect(screen.getAllByTestId('rank-badge')[0]).toHaveTextContent('1');
  });

  it('renders a sort chip for each stat', () => {
    renderCards();
    for (const label of ['G', 'AVG', 'OBP', 'SLG', 'OPS', 'H', 'HR', 'R', 'BB', 'SO', 'PA', 'AB']) {
      // The active chip (AVG by default) appends a direction arrow.
      expect(screen.getByRole('button', { name: new RegExp(`^${label}( ▲| ▼)?$`) })).toBeInTheDocument();
    }
  });

  it('re-sorts by the tapped stat and flips direction on a second tap', () => {
    renderCards();
    expect(cardNames()).toEqual(['Alpha', 'Beta']); // AVG desc

    fireEvent.click(screen.getByRole('button', { name: 'HR' }));
    expect(cardNames()).toEqual(['Beta', 'Alpha']); // HR desc

    fireEvent.click(screen.getByRole('button', { name: 'HR ▼' }));
    expect(cardNames()).toEqual(['Alpha', 'Beta']); // HR asc
  });

  it('switches sort field when a different chip is tapped', () => {
    renderCards();
    fireEvent.click(screen.getByRole('button', { name: 'G' }));
    expect(cardNames()).toEqual(['Beta', 'Alpha']); // G desc
  });

  it('keeps undefined rate stats last when sorting', () => {
    const withNull: PlayerStatRow[] = [
      ...ROWS,
      row({
        playerId: 'c',
        name: 'Zero',
        ab: 0,
        avg: null,
        obp: null,
        slg: null,
        ops: null,
        h: 0,
        tb: 0,
        singles: 0,
        doubles: 0,
        triples: 0,
        hr: 0,
        r: 0,
        bb: 0,
        pa: 0,
        g: 1,
      }),
    ];
    renderCards(withNull);
    expect(cardNames()).toEqual(['Alpha', 'Beta', 'Zero']);
    expect(within(screen.getAllByRole('listitem')[2]).getByTestId('stat-avg')).toHaveTextContent('—');
  });
});
