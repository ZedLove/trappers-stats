import { Alert, Box, Button, Divider, MenuItem, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  SeasonResultsSchema,
  type PlayoffMatchup,
  type SeasonResults,
  type Standing,
} from '../../shared/schema';
import { getState, saveResults, type AdminState } from '../api';
import { blockNegativeKeys, nonNegativeSlotProps } from '../numberInput';

function emptyStanding(): Standing {
  return { teamId: '', wins: undefined, losses: undefined, ties: undefined };
}

function emptyMatchup(): PlayoffMatchup {
  return { round: '', division: undefined, teamA: '', teamB: '', winner: undefined, note: '' };
}

function parseInteger(value: string): number | undefined {
  if (value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalText(value: string): string | undefined {
  return value === '' ? undefined : value;
}

export default function SeasonResults() {
  const [state, setState] = useState<AdminState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [season, setSeason] = useState<number | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [playoffs, setPlayoffs] = useState<PlayoffMatchup[]>([]);
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getState()
      .then((loaded) => {
        if (cancelled) return;
        setState(loaded);
        const latest = loaded.seasons.at(-1)?.season ?? new Date().getFullYear();
        setSeason(latest);
        const file = loaded.seasons.find((candidate) => candidate.season === latest);
        setStandings(file?.results?.standings ?? []);
        setPlayoffs(file?.results?.playoffs ?? []);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Failed to load admin state');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const teams = state?.teams.teams ?? [];
  const seasons = state?.seasons ?? [];

  function applySeason(year: number) {
    setSeason(year);
    setSaved(false);
    setSubmitError(null);
    const file = state?.seasons.find((candidate) => candidate.season === year);
    setStandings(file?.results?.standings ?? []);
    setPlayoffs(file?.results?.playoffs ?? []);
  }

  function updateStanding(index: number, patch: Partial<Standing>) {
    setStandings((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function updateMatchup(index: number, patch: Partial<PlayoffMatchup>) {
    setPlayoffs((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeStanding(index: number) {
    setStandings((prev) => prev.filter((_, i) => i !== index));
  }

  function removeMatchup(index: number) {
    setPlayoffs((prev) => prev.filter((_, i) => i !== index));
  }

  function moveStanding(index: number, direction: -1 | 1) {
    setStandings((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function onSubmit() {
    if (season == null) return;
    setSubmitError(null);
    const results: SeasonResults = { standings, playoffs };
    const parsed = SeasonResultsSchema.safeParse(results);
    if (!parsed.success) {
      setSubmitError(
        parsed.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; '),
      );
      return;
    }
    try {
      await saveResults(season, parsed.data);
      setSaved(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save results');
    }
  }

  if (loadError) {
    return <Alert severity="error">{loadError}</Alert>;
  }

  if (!state) {
    return <Typography>Loading…</Typography>;
  }

  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit();
      }}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 960 }}
    >
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <TextField
          select
          label="Season"
          size="small"
          sx={{ minWidth: 140 }}
          value={season == null ? '' : String(season)}
          onChange={(event) => applySeason(Number(event.target.value))}
        >
          {seasons.map((file) => (
            <MenuItem key={file.season} value={String(file.season)}>
              {file.season}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Divider />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle1">Standings</Typography>
        {standings.length === 0 ? (
          <Typography color="text.secondary">No standings rows yet.</Typography>
        ) : (
          standings.map((row, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: { xs: 'stretch', sm: 'center' },
                flexWrap: 'wrap',
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <TextField
                select
                label="Team"
                size="small"
                sx={{ minWidth: 160 }}
                value={row.teamId}
                onChange={(event) => updateStanding(index, { teamId: event.target.value })}
                slotProps={{ select: { native: true } }}
              >
                <option value="">Select team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </TextField>
              <TextField
                label="Wins"
                type="number"
                size="small"
                sx={{ width: { xs: '100%', sm: 88 } }}
                value={row.wins ?? ''}
                onChange={(event) => updateStanding(index, { wins: parseInteger(event.target.value) })}
                slotProps={nonNegativeSlotProps}
                onKeyDown={blockNegativeKeys}
              />
              <TextField
                label="Losses"
                type="number"
                size="small"
                sx={{ width: { xs: '100%', sm: 88 } }}
                value={row.losses ?? ''}
                onChange={(event) =>
                  updateStanding(index, { losses: parseInteger(event.target.value) })
                }
                slotProps={nonNegativeSlotProps}
                onKeyDown={blockNegativeKeys}
              />
              <TextField
                label="Ties"
                type="number"
                size="small"
                sx={{ width: { xs: '100%', sm: 88 } }}
                value={row.ties ?? ''}
                onChange={(event) => updateStanding(index, { ties: parseInteger(event.target.value) })}
                slotProps={nonNegativeSlotProps}
                onKeyDown={blockNegativeKeys}
              />
              <Button
                size="small"
                disabled={index === 0}
                onClick={() => moveStanding(index, -1)}
                aria-label={`Move standing ${index + 1} up`}
              >
                Up
              </Button>
              <Button
                size="small"
                disabled={index === standings.length - 1}
                onClick={() => moveStanding(index, 1)}
                aria-label={`Move standing ${index + 1} down`}
              >
                Down
              </Button>
              <Button
                size="small"
                onClick={() => removeStanding(index)}
                aria-label={`Remove standing ${index + 1}`}
              >
                Remove
              </Button>
            </Box>
          ))
        )}
        <Box>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setStandings((prev) => [...prev, emptyStanding()])}
          >
            Add team
          </Button>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle1">Playoffs</Typography>
        {playoffs.length === 0 ? (
          <Typography color="text.secondary">No playoff matchups yet.</Typography>
        ) : (
          playoffs.map((row, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: { xs: 'stretch', sm: 'center' },
                flexWrap: 'wrap',
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <TextField
                label="Round"
                size="small"
                sx={{ width: { xs: '100%', sm: 140 } }}
                value={row.round}
                onChange={(event) => updateMatchup(index, { round: event.target.value })}
              />
              <TextField
                select
                label="Division"
                size="small"
                sx={{ width: { xs: '100%', sm: 110 } }}
                value={row.division ?? ''}
                onChange={(event) =>
                  updateMatchup(index, {
                    division: event.target.value === '' ? undefined : (event.target.value as 'A' | 'B'),
                  })
                }
                slotProps={{ select: { native: true } }}
              >
                <option value="">None</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </TextField>
              <TextField
                select
                label="Team A"
                size="small"
                sx={{ minWidth: 160 }}
                value={row.teamA}
                onChange={(event) => updateMatchup(index, { teamA: event.target.value })}
                slotProps={{ select: { native: true } }}
              >
                <option value="">None</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </TextField>
              <TextField
                select
                label="Team B"
                size="small"
                sx={{ minWidth: 160 }}
                value={row.teamB}
                onChange={(event) => updateMatchup(index, { teamB: event.target.value })}
                slotProps={{ select: { native: true } }}
              >
                <option value="">None</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </TextField>
              <TextField
                select
                label="Winner"
                size="small"
                sx={{ minWidth: 160 }}
                value={row.winner ?? ''}
                onChange={(event) =>
                  updateMatchup(index, {
                    winner: event.target.value === '' ? undefined : event.target.value,
                  })
                }
                slotProps={{ select: { native: true } }}
              >
                <option value="">None</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </TextField>
              <TextField
                label="Note"
                size="small"
                sx={{ minWidth: 160 }}
                value={row.note ?? ''}
                onChange={(event) =>
                  updateMatchup(index, { note: parseOptionalText(event.target.value) })
                }
              />
              <Button
                size="small"
                onClick={() => removeMatchup(index)}
                aria-label={`Remove matchup ${index + 1}`}
              >
                Remove
              </Button>
            </Box>
          ))
        )}
        <Box>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setPlayoffs((prev) => [...prev, emptyMatchup()])}
          >
            Add matchup
          </Button>
        </Box>
      </Box>

      {saved && season != null && (
        <Alert severity="success">Results saved for {season}.</Alert>
      )}
      {submitError && <Alert severity="error">{submitError}</Alert>}

      <Box>
        <Button type="submit" variant="contained">
          Save results
        </Button>
      </Box>
    </Box>
  );
}
