// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SeasonFile } from '../../shared/schema';

const { testState } = vi.hoisted(() => ({
  testState: { seasons: [] as SeasonFile[], defaultSeasons: [] as SeasonFile[] },
}));

vi.mock('../../shared/data', async () => {
  const { makeGame, makeLine, makePlayer, makeSeason } = await import('../../fixtures/fixtures');
  const players = [
    makePlayer({ id: 'alpha', name: 'Alpha' }),
    makePlayer({ id: 'beta', name: 'Beta' }),
    makePlayer({ id: 'gamma', name: 'Gamma' }),
    makePlayer({ id: 'delta', name: 'Delta' }),
    makePlayer({ id: 'epsilon', name: 'Epsilon' }),
    makePlayer({ id: 'zeta', name: 'Zeta' }),
  ];
  const seasons = [
    makeSeason({
      season: 2026,
      division: null,
      games: [
        makeGame({
          id: 'g1',
          date: '2026-05-01',
          lines: [
            makeLine({ playerId: 'alpha', ab: 4, '1b': 2 }),
            makeLine({ playerId: 'beta', ab: 4, hr: 2 }),
            makeLine({ playerId: 'gamma', bb: 1 }),
            makeLine({ playerId: 'delta', ab: 4, '2b': 1 }),
            makeLine({ playerId: 'epsilon', ab: 4, '1b': 2 }),
            makeLine({ playerId: 'zeta', ab: 3, hr: 3 }), // 3 PA — below 1.58 × 2 games
          ],
        }),
        makeGame({
          id: 'g2',
          date: '2026-05-02',
          lines: [
            makeLine({ playerId: 'alpha', ab: 4, hr: 1 }),
            makeLine({ playerId: 'beta', ab: 4, hr: 2 }),
            makeLine({ playerId: 'gamma', bb: 2 }),
            makeLine({ playerId: 'delta', ab: 4, '2b': 1 }),
            makeLine({ playerId: 'epsilon', ab: 4, '3b': 1 }),
          ],
        }),
      ],
    }),
  ];
  testState.defaultSeasons = seasons;
  testState.seasons = seasons;
  return {
    players,
    get seasons() {
      return testState.seasons;
    },
    getPlayer: (id: string) => players.find((player) => player.id === id),
  };
});

import LeadersPage from './LeadersPage';

beforeEach(() => {
  testState.seasons = testState.defaultSeasons;
});

afterEach(cleanup);

function renderPage() {
  return render(
    <MemoryRouter>
      <LeadersPage />
    </MemoryRouter>,
  );
}

function section(heading: string): HTMLElement {
  const paper = screen.getByRole('heading', { name: heading }).closest('.MuiPaper-root');
  expect(paper).not.toBeNull();
  return paper as HTMLElement;
}

function card(field: string, scope: HTMLElement): HTMLElement {
  return within(scope).getByTestId(`leader-${field}`);
}

function entry(field: string, position: number, scope: HTMLElement): HTMLElement {
  return within(scope).getByTestId(`leader-${field}-${position}`);
}

describe('LeadersPage', () => {
  it('renders the two Paper sections and an all-time subtitle', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Leaders', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/all-time offensive leaders/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The Triple Crown' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Honourable Mentions' })).toBeInTheDocument();
  });

  it('shows five ranked entries with shrinking type for places 1-3 and paragraph text for 4-5', () => {
    renderPage();
    const hr = card('hr', section('The Triple Crown'));
    const entries = within(hr).getAllByRole('listitem');
    expect(entries).toHaveLength(5);

    expect(within(entry('hr', 1, hr)).getByRole('link')).toHaveTextContent('Beta');
    expect(entry('hr', 1, hr)).toHaveTextContent('1');
    expect(within(entry('hr', 2, hr)).getByRole('link')).toHaveTextContent('Zeta');
    // Unqualified players still appear in counting-stat categories.
    expect(within(entry('hr', 3, hr)).getByRole('link')).toHaveTextContent('Alpha');

    expect(within(hr).getByTestId('leader-hr-1-value')).toHaveClass('MuiTypography-h3');
    expect(within(hr).getByTestId('leader-hr-2-value')).toHaveClass('MuiTypography-h4');
    expect(within(hr).getByTestId('leader-hr-3-value')).toHaveClass('MuiTypography-h5');
    expect(within(hr).getByTestId('leader-hr-4-value')).toHaveClass('MuiTypography-body2');
    expect(within(hr).getByTestId('leader-hr-5-value')).toHaveClass('MuiTypography-body2');
  });

  it('shares a rank for ties', () => {
    renderPage();
    const avg = card('avg', section('The Triple Crown'));
    // Beta leads at .500; Alpha and Epsilon tie at .375 (competition ranks).
    expect(
      [1, 2, 3, 4].map(
        (position) => within(avg).getByTestId(`leader-avg-${position}-rank`).textContent,
      ),
    ).toEqual(['1.', '2.', '2.', '4.']);
  });

  it('defaults to all-time and switches to a single season', () => {
    renderPage();
    const season = screen.getByRole('combobox', { name: 'Season' });
    expect(season).toHaveTextContent('All-time');
    expect(screen.getByText(/all-time offensive leaders/i)).toBeInTheDocument();

    fireEvent.mouseDown(season);
    fireEvent.click(screen.getByRole('option', { name: '2026' }));

    expect(screen.getByText('2026 offensive leaders.')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Season' })).toHaveTextContent('2026');
  });

  it('shows medal icons only for the top three places', () => {
    renderPage();
    const hr = card('hr', section('The Triple Crown'));
    expect(within(hr).getByTestId('medal-hr-1')).toHaveAttribute('aria-label', '1st place');
    expect(within(hr).getByTestId('medal-hr-2')).toHaveAttribute('aria-label', '2nd place');
    expect(within(hr).getByTestId('medal-hr-3')).toHaveAttribute('aria-label', '3rd place');
    expect(within(hr).queryByTestId('medal-hr-4')).not.toBeInTheDocument();
    expect(within(hr).queryByTestId('medal-hr-5')).not.toBeInTheDocument();
  });

  it('lays each entry out in a horizontal flex row', () => {
    renderPage();
    const row = entry('hr', 1, section('The Triple Crown'));
    expect(row).toHaveStyle({ display: 'flex' });
    expect(row).toHaveStyle({ alignItems: 'center' });
  });

  it('excludes unqualified players from rate categories', () => {
    renderPage();
    const tripleCrown = section('The Triple Crown');

    const avg = card('avg', tripleCrown);
    expect(within(avg).getByTestId('leader-avg-1-value')).toHaveTextContent('.500');
    expect(within(avg).queryByRole('link', { name: 'Zeta' })).not.toBeInTheDocument();

    const ops = card('ops', tripleCrown);
    // Zeta's hypothetical 5.000 OPS is gated out; Beta leads at 2.500.
    expect(within(ops).getByTestId('leader-ops-1-value')).toHaveTextContent('2.500');
    expect(within(ops).queryByRole('link', { name: 'Zeta' })).not.toBeInTheDocument();
  });

  it('lists five in the Honourable Mentions categories too', () => {
    renderPage();
    const mentions = section('Honourable Mentions');

    const singles = card('singles', mentions);
    expect(within(singles).getAllByRole('listitem')).toHaveLength(5);
    expect(within(singles).getByRole('link', { name: 'Alpha' })).toBeInTheDocument();

    const walks = card('bb', mentions);
    expect(within(walks).getAllByRole('listitem')).toHaveLength(5);
    expect(within(walks).getByTestId('leader-bb-1-value')).toHaveTextContent('3');
    expect(within(walks).getByRole('link', { name: 'Gamma' })).toBeInTheDocument();
  });

  it('shows an empty state when there are no games', () => {
    testState.seasons = [];
    renderPage();
    expect(screen.getByText(/no leaders yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'The Triple Crown' })).not.toBeInTheDocument();
  });
});
