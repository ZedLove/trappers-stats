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
import type { Player } from '../../shared/schema';
import { suggestPlayerId } from '../server/apply.js';
import { getState, renamePlayer, savePlayer, type AdminState } from '../api';

export default function ManagePlayers() {
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

  const players = state?.players.players ?? [];
  const existingIds = players.map((player) => player.id);
  const suggestedId = name.trim() ? suggestPlayerId(name, existingIds) : '';

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setAddError(null);
    const player: Player = { id: suggestPlayerId(trimmed, existingIds), name: trimmed };
    try {
      await savePlayer(player);
      setState((prev) =>
        prev ? { ...prev, players: { players: [...prev.players.players, player] } } : prev,
      );
      setName('');
    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'Failed to save player');
    }
  }

  async function handleRename(id: string) {
    const nextName = (renameValues[id] ?? '').trim();
    if (!nextName) return;
    setRenameErrors((prev) => ({ ...prev, [id]: '' }));
    try {
      await renamePlayer(id, nextName);
      setState((prev) =>
        prev
          ? {
              ...prev,
              players: {
                players: prev.players.players.map((player) =>
                  player.id === id ? { ...player, name: nextName } : player,
                ),
              },
            }
          : prev,
      );
    } catch (error) {
      setRenameErrors((prev) => ({
        ...prev,
        [id]: error instanceof Error ? error.message : 'Failed to rename player',
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
        <Typography variant="subtitle1">Add player</Typography>
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
            Add player
          </Button>
        </Box>
        {addError && <Alert severity="error">{addError}</Alert>}
      </Box>

      <Divider />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle1">Players</Typography>
        {players.length === 0 ? (
          <Typography color="text.secondary">No players yet.</Typography>
        ) : (
          <List disablePadding>
            {players.map((player) => (
              <ListItem
                key={player.id}
                disableGutters
                sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
              >
                <Box sx={{ minWidth: 160 }}>
                  <Typography>{player.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {player.id}
                  </Typography>
                </Box>
                <TextField
                  size="small"
                  slotProps={{ htmlInput: { 'aria-label': `New name for ${player.name}` } }}
                  value={renameValues[player.id] ?? player.name}
                  onChange={(event) =>
                    setRenameValues((prev) => ({ ...prev, [player.id]: event.target.value }))
                  }
                />
                <Button
                  size="small"
                  aria-label={`Rename ${player.name}`}
                  onClick={() => handleRename(player.id)}
                >
                  Rename
                </Button>
                {renameErrors[player.id] && (
                  <Alert severity="error" sx={{ flex: '1 1 100%' }}>
                    {renameErrors[player.id]}
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
