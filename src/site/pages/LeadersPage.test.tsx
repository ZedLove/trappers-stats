// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
            makeLine({ playerId: 'delta', ab: 4 }), // hitless — ends Delta's hit streak
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

const originalMatchMedia = window.matchMedia;
const originalScrollIntoView = Element.prototype.scrollIntoView;

function stubMobile() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

function stubScroll() {
  const fn = vi.fn();
  Element.prototype.scrollIntoView = fn;
  return fn;
}

afterEach(() => {
  cleanup();
  window.matchMedia = originalMatchMedia;
  Element.prototype.scrollIntoView = originalScrollIntoView;
});

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
  it('renders the three Paper sections without a tagline', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Leaders', level: 1 })).toBeInTheDocument();
    expect(screen.queryByText(/offensive leaders across every season/i)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The Triple Crown' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Honourable Mentions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Streaks' })).toBeInTheDocument();
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

    fireEvent.mouseDown(season);
    fireEvent.click(screen.getByRole('option', { name: '2026' }));

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

  it('shows all four streak categories with the active-streak footnote', () => {
    renderPage();
    const streaks = section('Streaks');
    for (const field of ['hit', 'onbase', 'nok', 'xbh']) {
      expect(card(field, streaks)).toBeInTheDocument();
    }
    expect(within(streaks).getByText(/\* denotes active streak/i)).toBeInTheDocument();
  });

  it('marks ongoing streaks with an asterisk and leaves completed ones plain', () => {
    renderPage();
    const streaks = section('Streaks');
    const hits = card('hit', streaks);

    // Alpha's 2-game hit streak is still alive; Delta went hitless in game two.
    expect(within(hits).getByTestId('leader-hit-1-value')).toHaveTextContent('2*');
    expect(within(hits).getByTestId('leader-hit-4-value')).toHaveTextContent('1');
    expect(within(hits).getByTestId('leader-hit-4-value')).not.toHaveTextContent('*');
  });

  it('ranks extra-base streaks by consecutive 2B/3B/HR games', () => {
    renderPage();
    const xbh = card('xbh', section('Streaks'));
    expect(within(xbh).getByTestId('leader-xbh-1-value')).toHaveTextContent('2*');
    expect(within(xbh).getByRole('link', { name: 'Beta' })).toBeInTheDocument();
    expect(within(xbh).getByTestId('leader-xbh-3-value')).toHaveTextContent('1');
  });

  it('shows empty states for streak categories with no qualifying games', () => {
    testState.seasons = [
      {
        season: 2026,
        division: null,
        games: [
          {
            id: 'empty',
            date: '2026-05-01',
            phase: 'regular',
            opponentId: 't1',
            isHome: true,
            score: { us: 0, them: 0 },
            lines: [{ playerId: 'alpha', ab: 3, '1b': 0, '2b': 0, '3b': 0, hr: 0, bb: 0, sf: 0, k: 0, r: 0 }],
          },
        ],
      },
    ];
    renderPage();
    expect(within(card('xbh', section('Streaks'))).getByText(/no qualifying players yet/i)).toBeInTheDocument();
  });

  it('shows an empty state when there are no games', () => {
    testState.seasons = [];
    renderPage();
    expect(screen.getByText(/no leaders yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'The Triple Crown' })).not.toBeInTheDocument();
  });
});

describe('LeadersPage — mobile sections', () => {
  function header(name: RegExp | string) {
    return screen.getByRole('button', { name });
  }

  it('collapses sections on mobile with the Triple Crown open by default', () => {
    stubMobile();
    renderPage();

    expect(header(/The Triple Crown/)).toHaveAttribute('aria-expanded', 'true');
    expect(header(/Honourable Mentions/)).toHaveAttribute('aria-expanded', 'false');
    expect(header(/Streaks/)).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens one section at a time (accordion)', () => {
    stubMobile();
    renderPage();

    fireEvent.click(header(/Streaks/));
    expect(header(/Streaks/)).toHaveAttribute('aria-expanded', 'true');
    expect(header(/The Triple Crown/)).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(header(/Honourable Mentions/));
    expect(header(/Honourable Mentions/)).toHaveAttribute('aria-expanded', 'true');
    expect(header(/Streaks/)).toHaveAttribute('aria-expanded', 'false');
  });

  it('lets the open section be closed again', () => {
    stubMobile();
    renderPage();

    fireEvent.click(header(/The Triple Crown/));
    expect(header(/The Triple Crown/)).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps every section expanded on desktop', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: /The Triple Crown/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'The Triple Crown' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Streaks' })).toBeInTheDocument();
  });

  it('smooth-scrolls the newly opened section into view', async () => {
    stubMobile();
    const scroll = stubScroll();
    renderPage();
    expect(scroll).not.toHaveBeenCalled(); // loading the page doesn't scroll

    fireEvent.click(header(/Streaks/));
    await waitFor(() =>
      expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' }),
    );
    expect(scroll.mock.instances[0]).toHaveTextContent('Streaks');
  });

  it('does not scroll when a section is closed', () => {
    stubMobile();
    const scroll = stubScroll();
    renderPage();

    fireEvent.click(header(/The Triple Crown/)); // closes the default-open section
    expect(scroll).not.toHaveBeenCalled();
  });
});
