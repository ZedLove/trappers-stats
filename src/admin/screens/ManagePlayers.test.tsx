// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PlayersFile, SeasonFile, TeamsFile } from '../../shared/schema';
import ManagePlayers from './ManagePlayers';

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
  teams: { teams: [] } satisfies TeamsFile,
  seasons: [] satisfies SeasonFile[],
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
    if (url.endsWith('/save-player')) {
      const body = JSON.parse(String(init?.body)) as {
        player: { id: string; name: string };
      };
      if (STATE.players.players.some((player) => player.name === body.player.name)) {
        return jsonResponse(
          {
            issues: [
              { path: 'name', message: `Duplicate player name "${body.player.name}"` },
            ],
          },
          false,
          400,
        );
      }
      return jsonResponse({ players: [...STATE.players.players, body.player] });
    }
    if (url.endsWith('/rename-player')) {
      const body = JSON.parse(String(init?.body)) as { id: string; name: string };
      if (STATE.players.players.some((p) => p.id !== body.id && p.name === body.name)) {
        return jsonResponse(
          { issues: [{ path: 'name', message: `Duplicate player name "${body.name}"` }] },
          false,
          400,
        );
      }
      return jsonResponse({
        players: STATE.players.players.map((p) =>
          p.id === body.id ? { ...p, name: body.name } : p,
        ),
      });
    }
    return jsonResponse({ issues: [{ path: '', message: 'Not found' }] }, false, 404);
  });
  vi.stubGlobal('fetch', fetchMock);
});

function callsMatching(suffix: string) {
  return fetchMock.mock.calls.filter(([input]) => String(input).includes(suffix));
}

async function renderLoaded() {
  render(<ManagePlayers />);
  await screen.findByText('Z-Man');
}

describe('ManagePlayers', () => {
  it('renders the list of current players', async () => {
    await renderLoaded();
    expect(screen.getByText('Z-Man')).toBeInTheDocument();
    expect(screen.getByText('Stretch')).toBeInTheDocument();
  });

  it('adds a player by posting the suggested id and name', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Anna' } });

    expect((screen.getByLabelText('ID') as HTMLInputElement).value).toBe('anna');

    fireEvent.click(screen.getByRole('button', { name: 'Add player' }));
    await screen.findByText('Anna');

    const calls = callsMatching('save-player');
    expect(calls).toHaveLength(1);
    const init = calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body)) as {
      player: { id: string; name: string };
    };
    expect(body.player).toEqual({ id: 'anna', name: 'Anna' });
  });

  it('surfaces the endpoint 400 message when a name is a duplicate', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Z-Man' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add player' }));

    expect(await screen.findByText('Duplicate player name "Z-Man"')).toBeInTheDocument();
  });

  it('renames a player by posting the same id with the new name', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByLabelText('New name for Z-Man'), {
      target: { value: 'Zed' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Rename Z-Man' }));

    await screen.findByText('Zed');

    const calls = callsMatching('rename-player');
    expect(calls).toHaveLength(1);
    const init = calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body)) as { id: string; name: string };
    expect(body).toEqual({ id: 'z-man', name: 'Zed' });
  });
});
