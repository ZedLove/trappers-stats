// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  LocationsFile,
  PlayersFile,
  SeasonFile,
  TeamsFile,
} from '../../shared/schema';
import ManageLocations from './ManageLocations';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const STATE = {
  players: { players: [] } satisfies PlayersFile,
  teams: { teams: [] } satisfies TeamsFile,
  locations: {
    locations: [
      { id: 'doverfield-park', name: 'Doverfield Park' },
      { id: 'riverbend-field', name: 'Riverbend Field' },
    ],
  } satisfies LocationsFile,
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
    if (url.endsWith('/save-location')) {
      const body = JSON.parse(String(init?.body)) as {
        location: { id: string; name: string };
      };
      if (STATE.locations.locations.some((location) => location.name === body.location.name)) {
        return jsonResponse(
          {
            issues: [
              { path: 'name', message: `Duplicate location name "${body.location.name}"` },
            ],
          },
          false,
          400,
        );
      }
      return jsonResponse({ locations: [...STATE.locations.locations, body.location] });
    }
    if (url.endsWith('/rename-location')) {
      const body = JSON.parse(String(init?.body)) as { id: string; name: string };
      if (STATE.locations.locations.some((l) => l.id !== body.id && l.name === body.name)) {
        return jsonResponse(
          { issues: [{ path: 'name', message: `Duplicate location name "${body.name}"` }] },
          false,
          400,
        );
      }
      return jsonResponse({
        locations: STATE.locations.locations.map((l) =>
          l.id === body.id ? { ...l, name: body.name } : l,
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
  render(<ManageLocations />);
  await screen.findByText('Doverfield Park');
}

describe('ManageLocations', () => {
  it('renders the list of current locations', async () => {
    await renderLoaded();
    expect(screen.getByText('Doverfield Park')).toBeInTheDocument();
    expect(screen.getByText('Riverbend Field')).toBeInTheDocument();
  });

  it('adds a location by posting the slugified id and name', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Sunny Meadows' } });

    expect((screen.getByLabelText('ID') as HTMLInputElement).value).toBe('sunny-meadows');

    fireEvent.click(screen.getByRole('button', { name: 'Add location' }));
    await screen.findByText('Sunny Meadows');

    const calls = callsMatching('save-location');
    expect(calls).toHaveLength(1);
    const init = calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body)) as {
      location: { id: string; name: string };
    };
    expect(body.location).toEqual({ id: 'sunny-meadows', name: 'Sunny Meadows' });
  });

  it('surfaces the endpoint 400 message when a name is a duplicate', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Doverfield Park' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add location' }));

    expect(
      await screen.findByText('Duplicate location name "Doverfield Park"'),
    ).toBeInTheDocument();
  });

  it('renames a location by posting the same id with the new name', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByLabelText('New name for Doverfield Park'), {
      target: { value: 'Dover Park' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Rename Doverfield Park' }));

    await screen.findByText('Dover Park');

    const calls = callsMatching('rename-location');
    expect(calls).toHaveLength(1);
    const init = calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body)) as { id: string; name: string };
    expect(body).toEqual({ id: 'doverfield-park', name: 'Dover Park' });
  });
});
