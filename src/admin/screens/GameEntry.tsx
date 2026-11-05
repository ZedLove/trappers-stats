import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  createFilterOptions,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch, type Resolver } from 'react-hook-form';
import { suggestGameId, suggestPlayerId } from '../../admin/server/apply.js';
import {
  GameSchema,
  type Game,
  type Player,
  type PlayerLine,
  type Team,
} from '../../shared/schema';
import { gameWarnings } from '../../shared/validate';
import { getState, saveGame, savePlayer, saveTeam, type AdminState } from '../api';
import LineupGrid from '../components/LineupGrid';
import LivePreview from '../components/LivePreview';

const PHASE_OPTIONS = [
  { value: 'regular', label: 'Regular Season' },
  { value: 'round_robin', label: 'Round Robin' },
  { value: 'playoff', label: 'Playoffs' },
] as const;

interface TeamOption extends Team {
  inputValue?: string;
  isNew?: boolean;
}

const teamFilter = createFilterOptions<TeamOption>();

function emptyLine(): PlayerLine {
  return {
    playerId: '',
    ab: 0,
    '1b': 0,
    '2b': 0,
    '3b': 0,
    hr: 0,
    bb: 0,
    sf: 0,
    k: 0,
    r: 0,
  };
}

const defaultValues: Game = {
  id: '',
  date: '',
  phase: 'regular',
  opponentId: '',
  location: '',
  score: { us: 0, them: 0 },
  lines: [emptyLine()],
};

export default function GameEntry() {
  const [state, setState] = useState<AdminState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [season, setSeason] = useState<number | null>(null);
  const [isNewSeason, setIsNewSeason] = useState(false);
  const [seasonInput, setSeasonInput] = useState('');
  const [savedGame, setSavedGame] = useState<Game | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<Game>({
    resolver: zodResolver(GameSchema) as Resolver<Game>,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  useEffect(() => {
    let cancelled = false;
    getState()
      .then((loaded) => {
        if (cancelled) return;
        setState(loaded);
        setSeason(loaded.seasons.at(-1)?.season ?? new Date().getFullYear());
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : 'Failed to load admin state');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const players = state?.players.players ?? [];
  const teams = state?.teams.teams ?? [];
  const seasons = state?.seasons ?? [];
  const opponents = teams.filter((team) => team.us !== true);

  const watched = useWatch({ control }) as Game;
  const warnings = gameWarnings(watched);

  async function handleAddTeam(name: string): Promise<Team> {
    // Team ids use the same slugify + dedupe rule as player ids.
    const id = suggestPlayerId(name, teams.map((team) => team.id));
    const team: Team = { id, name };
    await saveTeam(team);
    setState((prev) =>
      prev ? { ...prev, teams: { teams: [...prev.teams.teams, team] } } : prev,
    );
    return team;
  }

  async function handleAddPlayer(name: string): Promise<Player> {
    const id = suggestPlayerId(name, players.map((player) => player.id));
    const player: Player = { id, name };
    await savePlayer(player);
    setState((prev) =>
      prev ? { ...prev, players: { players: [...prev.players.players, player] } } : prev,
    );
    return player;
  }

  async function onSubmit(values: Game) {
    if (season == null) return;
    setSubmitError(null);

    const existingIds = seasons.flatMap((seasonFile) => seasonFile.games.map((game) => game.id));
    const id = suggestGameId(values.date, values.opponentId, existingIds);
    const game: Game = { ...values, id };

    try {
      await saveGame(season, game);
      setSavedGame(game);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save game');
    }
  }

  function handleAnother() {
    setSavedGame(null);
    setSubmitError(null);
    reset(defaultValues);
  }

  if (loadError) {
    return <Alert severity="error">{loadError}</Alert>;
  }

  if (!state) {
    return <Typography>Loading…</Typography>;
  }

  if (savedGame) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}>
        <Alert severity="success">Game saved: {savedGame.id}</Alert>
        <Box>
          <Button variant="contained" onClick={handleAnother}>
            Enter another game
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <TextField
          select
          label="Season"
          size="small"
          sx={{ minWidth: 140 }}
          value={isNewSeason ? 'new' : season == null ? '' : String(season)}
          onChange={(event) => {
            const value = event.target.value;
            if (value === 'new') {
              setIsNewSeason(true);
              setSeasonInput('');
              setSeason(null);
            } else {
              setIsNewSeason(false);
              setSeason(Number(value));
            }
          }}
        >
          {seasons.map((seasonFile) => (
            <MenuItem key={seasonFile.season} value={String(seasonFile.season)}>
              {seasonFile.season}
            </MenuItem>
          ))}
          <MenuItem value="new">New season…</MenuItem>
        </TextField>
        {isNewSeason && (
          <TextField
            label="Season year"
            size="small"
            type="number"
            sx={{ width: 120 }}
            value={seasonInput}
            onChange={(event) => {
              setSeasonInput(event.target.value);
              setSeason(event.target.value === '' ? null : Number(event.target.value));
            }}
          />
        )}
        <Controller
          control={control}
          name="date"
          render={({ field, fieldState }) => (
            <TextField
              label="Date"
              type="date"
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="phase"
          render={({ field }) => (
            <TextField
              select
              label="Phase"
              size="small"
              sx={{ minWidth: 160 }}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            >
              {PHASE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          control={control}
          name="opponentId"
          render={({ field, fieldState }) => {
            const selected = teams.find((team) => team.id === field.value) ?? null;
            return (
              <Autocomplete<TeamOption>
                options={opponents}
                value={selected}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => option.name}
                filterOptions={(options, params) => {
                  const filtered = teamFilter(options, params);
                  const { inputValue } = params;
                  const exists = options.some((option) => option.name === inputValue);
                  if (inputValue !== '' && !exists) {
                    filtered.push({
                      id: `__new__${inputValue}`,
                      name: inputValue,
                      inputValue,
                      isNew: true,
                    });
                  }
                  return filtered;
                }}
                onChange={(_, value) => {
                  if (!value) {
                    field.onChange('');
                    return;
                  }
                  if (value.isNew) {
                    void handleAddTeam(value.name).then((created) => field.onChange(created.id));
                  } else {
                    field.onChange(value.id);
                  }
                }}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    {option.isNew ? `Add "${option.name}"` : option.name}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Opponent"
                    size="small"
                    sx={{ minWidth: 180 }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            );
          }}
        />
        <Controller
          control={control}
          name="location"
          render={({ field }) => (
            <TextField
              label="Location"
              size="small"
              sx={{ minWidth: 180 }}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <Controller
          control={control}
          name="score.us"
          render={({ field, fieldState }) => (
            <TextField
              label="Our score"
              type="number"
              size="small"
              sx={{ width: 100 }}
              value={field.value}
              onChange={(event) =>
                field.onChange(event.target.value === '' ? 0 : Number(event.target.value))
              }
              onBlur={field.onBlur}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="score.them"
          render={({ field, fieldState }) => (
            <TextField
              label="Their score"
              type="number"
              size="small"
              sx={{ width: 100 }}
              value={field.value}
              onChange={(event) =>
                field.onChange(event.target.value === '' ? 0 : Number(event.target.value))
              }
              onBlur={field.onBlur}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      </Box>

      {warnings.map((warning) => (
        <Alert key={warning} severity="warning">
          {warning}
        </Alert>
      ))}

      <LineupGrid
        control={control}
        fields={fields}
        onAppend={() => append(emptyLine())}
        onRemove={(index) => remove(index)}
        players={players}
        onAddPlayer={handleAddPlayer}
      />

      <LivePreview lines={watched.lines} />

      {submitError && <Alert severity="error">{submitError}</Alert>}

      <Box>
        <Button type="submit" variant="contained">
          Save game
        </Button>
      </Box>
    </Box>
  );
}
