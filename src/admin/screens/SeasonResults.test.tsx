// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SeasonResultsSchema,
  type PlayersFile,
  type SeasonFile,
  type TeamsFile,
} from '../../shared/schema';
import SeasonResults from './SeasonResults';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const STATE = {
  players: { players: [] } satisfies PlayersFile,
  teams: {
    teams: [
      { id: 'trappers', name: 'Trappers', us: true },
      { id: 'hornets', name: 'Hornets' },
      { id: 'bandits', name: 'Bandits' },
    ],
  } satisfies TeamsFile,
  seasons: [
    {
      season: 2026,
      division: null,
      games: [],
      results: {
        standings: [
          { teamId: 'bandits', wins: 10, losses: 2, ties: 0 },
          { teamId: 'trappers', wins: 9, losses: 3, ties: 0 },
        ],
        playoffs: [
          {
            round: 'Semifinal',
            division: 'B',
            teamA: 'trappers',
            teamB: 'hornets',
            winner: 'trappers',
            note: 'Won 6-4',
          },
        ],
      },
    },
  ] satisfies SeasonFile[],
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
    if (url.endsWith('/save-results')) {
      const body = JSON.parse(String(init?.body)) as { season: number; results: unknown };
      return jsonResponse({
        season: body.season,
        division: null,
        games: [],
        results: body.results,
      });
    }
    return jsonResponse({ issues: [{ path: '', message: 'Not found' }] }, false, 404);
  });
  vi.stubGlobal('fetch', fetchMock);
});

function saveResultsCalls() {
  return fetchMock.mock.calls.filter(([input]) => String(input).includes('save-results'));
}

async function renderLoaded() {
  render(<SeasonResults />);
  await screen.findByText('Standings');
}

describe('SeasonResults', () => {
  it('loads existing results into the form', async () => {
    await renderLoaded();

    const winsInputs = screen.getAllByLabelText('Wins') as HTMLInputElement[];
    expect(winsInputs).toHaveLength(2);
    expect(winsInputs[0].value).toBe('10');
    expect(winsInputs[1].value).toBe('9');

    const roundInputs = screen.getAllByLabelText('Round') as HTMLInputElement[];
    expect(roundInputs).toHaveLength(1);
    expect(roundInputs[0].value).toBe('Semifinal');
    expect((screen.getByLabelText('Note') as HTMLInputElement).value).toBe('Won 6-4');
  });

  it('posts a body satisfying SeasonResultsSchema after editing and adding rows', async () => {
    await renderLoaded();

    const winsInputs = screen.getAllByLabelText('Wins') as HTMLInputElement[];
    fireEvent.change(winsInputs[0], { target: { value: '11' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add matchup' }));

    const roundInputs = screen.getAllByLabelText('Round') as HTMLInputElement[];
    expect(roundInputs).toHaveLength(2);
    fireEvent.change(roundInputs[1], { target: { value: 'Final' } });

    const teamASelects = screen.getAllByLabelText('Team A') as HTMLSelectElement[];
    fireEvent.change(teamASelects[1], { target: { value: 'bandits' } });
    const teamBSelects = screen.getAllByLabelText('Team B') as HTMLSelectElement[];
    fireEvent.change(teamBSelects[1], { target: { value: 'trappers' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save results' }));

    expect(await screen.findByText(/Results saved/)).toBeInTheDocument();

    const calls = saveResultsCalls();
    expect(calls).toHaveLength(1);
    const init = calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body)) as { season: number; results: unknown };
    expect(body.season).toBe(2026);

    const parsed = SeasonResultsSchema.safeParse(body.results);
    expect(parsed.success).toBe(true);
    const results = parsed.success ? parsed.data : null;
    expect(results?.standings[0]).toMatchObject({ teamId: 'bandits', wins: 11 });
    expect(results?.playoffs).toHaveLength(2);
    expect(results?.playoffs[1]).toMatchObject({
      round: 'Final',
      teamA: 'bandits',
      teamB: 'trappers',
    });
  });
});
