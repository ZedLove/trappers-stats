import {
  Alert,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { Location } from '../../shared/schema';
import { slugify } from '../server/apply.js';
import { getState, renameLocation, saveLocation, type AdminState } from '../api';

export default function ManageLocations() {
  const [state, setState] = useState<AdminState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [renameValues, setRenameValues] = useState<Record<string, string>>({});
  const [renameErrors, setRenameErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    getState()
      .then((loaded) => {
        if (!cancelled) setState(loaded);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Failed to load admin state');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const locations = state?.locations.locations ?? [];
  const suggestedId = name.trim() ? slugify(name) : '';

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setAddError(null);
    const location: Location = { id: slugify(trimmed), name: trimmed };
    try {
      await saveLocation(location);
      setState((prev) =>
        prev
          ? { ...prev, locations: { locations: [...prev.locations.locations, location] } }
          : prev,
      );
      setName('');
    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'Failed to save location');
    }
  }

  async function handleRename(id: string) {
    const nextName = (renameValues[id] ?? '').trim();
    if (!nextName) return;
    setRenameErrors((prev) => ({ ...prev, [id]: '' }));
    try {
      await renameLocation(id, nextName);
      setState((prev) =>
        prev
          ? {
              ...prev,
              locations: {
                locations: prev.locations.locations.map((location) =>
                  location.id === id ? { ...location, name: nextName } : location,
                ),
              },
            }
          : prev,
      );
    } catch (error) {
      setRenameErrors((prev) => ({
        ...prev,
        [id]: error instanceof Error ? error.message : 'Failed to rename location',
      }));
    }
  }

  if (loadError) {
    return <Alert severity="error">{loadError}</Alert>;
  }

  if (!state) {
    return <Typography>Loading…</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 560 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle1">Add location</Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'flex-end' },
            flexWrap: 'wrap',
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <TextField
            label="Name"
            size="small"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            label="ID"
            size="small"
            value={suggestedId}
            slotProps={{ input: { readOnly: true } }}
            placeholder="Auto-generated"
          />
          <Button variant="contained" onClick={handleAdd} disabled={!name.trim()}>
            Add location
          </Button>
        </Box>
        {addError && <Alert severity="error">{addError}</Alert>}
      </Box>

      <Divider />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle1">Locations</Typography>
        {locations.length === 0 ? (
          <Typography color="text.secondary">No locations yet.</Typography>
        ) : (
          <List disablePadding>
            {locations.map((location) => (
              <ListItem
                key={location.id}
                disableGutters
                sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
              >
                <Box sx={{ minWidth: 160 }}>
                  <Typography>{location.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {location.id}
                  </Typography>
                </Box>
                <TextField
                  size="small"
                  slotProps={{ htmlInput: { 'aria-label': `New name for ${location.name}` } }}
                  value={renameValues[location.id] ?? location.name}
                  onChange={(event) =>
                    setRenameValues((prev) => ({ ...prev, [location.id]: event.target.value }))
                  }
                />
                <Button
                  size="small"
                  aria-label={`Rename ${location.name}`}
                  onClick={() => handleRename(location.id)}
                >
                  Rename
                </Button>
                {renameErrors[location.id] && (
                  <Alert severity="error" sx={{ flex: '1 1 100%' }}>
                    {renameErrors[location.id]}
                  </Alert>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}
