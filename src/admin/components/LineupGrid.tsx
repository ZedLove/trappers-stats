import {
  Autocomplete,
  Box,
  Button,
  createFilterOptions,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, type Control } from 'react-hook-form';
import type { Game, Player, PlayerLine } from '../../shared/schema';

const STAT_FIELDS: Array<{ key: keyof PlayerLine; label: string }> = [
  { key: 'ab', label: 'AB' },
  { key: '1b', label: '1B' },
  { key: '2b', label: '2B' },
  { key: '3b', label: '3B' },
  { key: 'hr', label: 'HR' },
  { key: 'bb', label: 'BB' },
  { key: 'sf', label: 'SF' },
  { key: 'k', label: 'K' },
  { key: 'r', label: 'R' },
];

interface PlayerOption extends Player {
  inputValue?: string;
  isNew?: boolean;
}

const filter = createFilterOptions<PlayerOption>();

export interface LineupGridProps {
  control: Control<Game>;
  fields: Array<PlayerLine & { id: string }>;
  onAppend: () => void;
  onRemove: (index: number) => void;
  players: Player[];
  onAddPlayer: (name: string) => Promise<Player>;
}

export default function LineupGrid({
  control,
  fields,
  onAppend,
  onRemove,
  players,
  onAddPlayer,
}: LineupGridProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography variant="h6" component="h2">
        Lineup
      </Typography>
      {fields.map((field, index) => (
        <Box
          key={field.id}
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: { xs: 'stretch', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <Controller
            control={control}
            name={`lines.${index}.playerId`}
            render={({ field: playerField, fieldState }) => {
              const selected = players.find((player) => player.id === playerField.value) ?? null;
              return (
                <Autocomplete<PlayerOption>
                  options={players}
                  value={selected}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(option) => option.name}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);
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
                      playerField.onChange('');
                      return;
                    }
                    if (value.isNew) {
                      void onAddPlayer(value.name).then((created) => playerField.onChange(created.id));
                    } else {
                      playerField.onChange(value.id);
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
                      label="Player"
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
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {STAT_FIELDS.map(({ key, label }) => (
              <Controller
                key={key}
                control={control}
                name={`lines.${index}.${key}`}
                render={({ field: statField, fieldState }) => (
                  <TextField
                    type="number"
                    size="small"
                    label={label}
                    sx={{ width: 64 }}
                    value={statField.value}
                    onChange={(event) =>
                      statField.onChange(
                        event.target.value === '' ? 0 : Number(event.target.value),
                      )
                    }
                    onBlur={statField.onBlur}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            ))}
            <Button
              size="small"
              onClick={() => onRemove(index)}
              disabled={fields.length <= 1}
            >
              Remove
            </Button>
          </Box>
        </Box>
      ))}
      <Box>
        <Button size="small" onClick={onAppend}>
          Add player
        </Button>
      </Box>
    </Box>
  );
}
