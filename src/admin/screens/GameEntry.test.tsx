// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GameSchema,
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
    expect(GameSchema.safeParse(body.game).success).toBe(true);
  });
});
