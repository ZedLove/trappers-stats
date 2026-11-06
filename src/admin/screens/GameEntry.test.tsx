// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GameSchema,
  type Game,
  type LocationsFile,
  type PlayersFile,
  type SeasonFile,
  type TeamsFile,
} from '../../shared/schema';
import GameEntry from './GameEntry';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const STATE = {
  players: {
    players: [
      { id: 'z-man', name: 'Z-Man' },
      { id: 'stretch', name: 'Stretch' },
    ],
  } satisfies PlayersFile,
  teams: {
    teams: [
      { id: 'trappers', name: 'Trappers', us: true },
      { id: 'hornets', name: 'Hornets' },
    ],
  } satisfies TeamsFile,
  locations: {
    locations: [
      { id: 'doverfield-park', name: 'Doverfield Park' },
      { id: 'riverbend-field', name: 'Riverbend Field' },
    ],
  } satisfies LocationsFile,
  seasons: [{ season: 2026, division: null, games: [] }] satisfies SeasonFile[],
};

function jsonResponse(data: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => data } as Response;
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/state')) {
      return jsonResponse(STATE);
    }
    if (url.endsWith('/save-game')) {
      const body = JSON.parse(String(init?.body)) as { season: number; game: unknown };
      return jsonResponse({ season: body.season, division: null, games: [body.game] });
    }
    return jsonResponse({ issues: [{ path: '', message: 'Not found' }] }, false, 404);
  });
  vi.stubGlobal('fetch', fetchMock);
});

function saveGameCalls() {
  return fetchMock.mock.calls.filter(([input]) => String(input).includes('save-game'));
}

async function renderLoaded() {
  render(<GameEntry />);
  await screen.findByRole('combobox', { name: 'Opponent' });
}

function setDate(value: string) {
  fireEvent.change(screen.getByLabelText('Date'), { target: { value } });
}

async function selectOpponent(name: string) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Opponent' }));
  fireEvent.click(await screen.findByRole('option', { name }));
}

async function selectPlayer(name: string) {
  fireEvent.mouseDown(screen.getAllByRole('combobox', { name: 'Player' })[0]);
  fireEvent.click(await screen.findByRole('option', { name }));
}

function setNumber(label: string, value: number) {
  fireEvent.change(screen.getAllByLabelText(label)[0], { target: { value: String(value) } });
}

function setScore(us: number, them: number) {
  fireEvent.change(screen.getByLabelText('Our score'), { target: { value: String(us) } });
  fireEvent.change(screen.getByLabelText('Their score'), { target: { value: String(them) } });
}

async function fillMetadata() {
  setDate('2026-05-05');
  await selectOpponent('Hornets');
  setScore(5, 3);
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Save game' }));
}

describe('GameEntry', () => {
  it('blocks submit and fires no save when a line has 1b+k > ab', async () => {
    await renderLoaded();
    await fillMetadata();
    await selectPlayer('Z-Man');
    setNumber('AB', 1);
    setNumber('1B', 1);
    setNumber('K', 1);

    submit();

    expect(await screen.findByText('Hits and strikeouts cannot exceed at-bats')).toBeInTheDocument();
    expect(saveGameCalls()).toHaveLength(0);
  });

  it('shows the runs-mismatch warning but still submits', async () => {
    await renderLoaded();
    await fillMetadata();
    await selectPlayer('Z-Man');
    setNumber('AB', 3);
    setNumber('1B', 1);

    expect(
      await screen.findByText('Player-line runs (0) do not match team score (5)'),
    ).toBeInTheDocument();

    submit();
    expect(await screen.findByText(/Game saved/)).toBeInTheDocument();
    expect(saveGameCalls()).toHaveLength(1);
  });

  it('posts a body that satisfies GameSchema and shows the confirmation', async () => {
    await renderLoaded();
    await fillMetadata();
    await selectPlayer('Z-Man');
    setNumber('AB', 3);
    setNumber('1B', 1);
    setNumber('R', 5);

    submit();

    expect(await screen.findByText(/Game saved/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter another game' })).toBeInTheDocument();

    const calls = saveGameCalls();
    expect(calls).toHaveLength(1);
    const init = calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body)) as { season: number; game: unknown };
    expect(body.season).toBe(2026);
    const parsed = GameSchema.safeParse(body.game);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.isHome).toBe(true);
      expect(parsed.data.innings).toHaveLength(9);
      expect(parsed.data.opponentHits).toBeUndefined();
    }
  });

  it('defaults to home and records away when toggled', async () => {
    await renderLoaded();
    await fillMetadata();
    await selectPlayer('Z-Man');
    setNumber('AB', 3);
    setNumber('1B', 1);
    setNumber('R', 5);

    const home = screen.getByRole('button', { name: 'Home' });
    const away = screen.getByRole('button', { name: 'Away' });
    expect(home).toHaveAttribute('aria-pressed', 'true');
    expect(away).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(away);

    submit();
    expect(await screen.findByText(/Game saved/)).toBeInTheDocument();

    const body = JSON.parse(String((saveGameCalls()[0][1] as RequestInit).body)) as {
      season: number;
      game: Game;
    };
    expect(body.game.isHome).toBe(false);
  });

  it('renders a nine-inning linescore and can add or remove innings', async () => {
    await renderLoaded();

    const usInputs = () => screen.getAllByLabelText('Us');
    expect(usInputs()).toHaveLength(9);
    expect(screen.getByText('Inning 9')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Add inning' }));
    expect(usInputs()).toHaveLength(10);
    expect(screen.getByText('Inning 10')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove inning' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove inning' }));
    expect(usInputs()).toHaveLength(8);

    for (let i = 0; i < 7; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Remove inning' }));
    }
    expect(usInputs()).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Remove inning' })).toBeDisabled();
  });

  it('marks numeric inputs with a zero minimum and blocks negative keystrokes', async () => {
    await renderLoaded();

    const score = screen.getByLabelText('Our score') as HTMLInputElement;
    expect(score.min).toBe('0');
    expect(fireEvent.keyDown(score, { key: '-' })).toBe(false);

    const ab = screen.getAllByLabelText('AB')[0] as HTMLInputElement;
    expect(ab.min).toBe('0');

    const inningUs = screen.getAllByLabelText('Us')[0] as HTMLInputElement;
    expect(inningUs.min).toBe('0');
    expect(fireEvent.keyDown(inningUs, { key: 'e' })).toBe(false);
  });
});
