// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
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
            makeLine({ playerId: 'alpha', ab: 4, '1b': 2 }), // .500, 2 singles
            makeLine({ playerId: 'beta', ab: 4, '1b': 1 }), // .250
            makeLine({ playerId: 'gamma', bb: 1 }), // no AB -> null rates, 1 BB
          ],
        }),
        makeGame({
          id: 'g2',
          date: '2026-05-02',
          lines: [
            makeLine({ playerId: 'alpha', ab: 4, '1b': 1 }), // 3-for-8, .375
            makeLine({ playerId: 'beta', ab: 4, hr: 1 }), // 2-for-8, 1 HR
            makeLine({ playerId: 'gamma', bb: 2 }), // 3 BB total
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
  const title = screen.getByRole('heading', { name: heading });
  const paper = title.closest('.MuiPaper-root');
  expect(paper).not.toBeNull();
  return paper as HTMLElement;
}

function card(field: string, scope: HTMLElement): HTMLElement {
  return within(scope).getByTestId(`leader-${field}`);
}

describe('LeadersPage', () => {
  it('renders the two Paper sections and an all-time subtitle', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Leaders', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/all-time offensive leaders/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The Triple Crown' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Honourable Mentions' })).toBeInTheDocument();
  });

  it('shows the AVG and OPS leaders with formatted rates', () => {
    renderPage();
    const tripleCrown = section('The Triple Crown');

    const avg = card('avg', tripleCrown);
    expect(within(avg).getByText('.375')).toBeInTheDocument(); // Alpha 3-for-8
    expect(within(avg).getByRole('link', { name: 'Alpha' })).toHaveAttribute('href', '/players/alpha');

    const ops = card('ops', tripleCrown);
    expect(within(ops).getByText('.875')).toBeInTheDocument(); // Beta: .250 OBP + .625 SLG
    expect(within(ops).getByRole('link', { name: 'Beta' })).toBeInTheDocument();
  });

  it('shows the home-run leader as a raw count', () => {
    renderPage();
    const hr = card('hr', section('The Triple Crown'));
    expect(within(hr).getByText('1')).toBeInTheDocument();
    expect(within(hr).getByRole('link', { name: 'Beta' })).toBeInTheDocument();
  });

  it('shows the singles and walks leaders in Honourable Mentions', () => {
    renderPage();
    const mentions = section('Honourable Mentions');

    const singles = card('singles', mentions);
    expect(within(singles).getByText('3')).toBeInTheDocument();
    expect(within(singles).getByRole('link', { name: 'Alpha' })).toBeInTheDocument();

    const walks = card('bb', mentions);
    expect(within(walks).getByText('3')).toBeInTheDocument();
    expect(within(walks).getByRole('link', { name: 'Gamma' })).toBeInTheDocument();
  });

  it('lists every player when a category is tied', () => {
    renderPage();
    // Nobody hit a triple — all three players are tied at zero.
    const triples = card('triples', section('Honourable Mentions'));
    expect(within(triples).getByText('0')).toBeInTheDocument();
    expect(within(triples).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Alpha',
      'Beta',
      'Gamma',
    ]);
  });

  it('shows an empty state when there are no games', () => {
    testState.seasons = [];
    renderPage();
    expect(screen.getByText(/no leaders yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'The Triple Crown' })).not.toBeInTheDocument();
  });
});
