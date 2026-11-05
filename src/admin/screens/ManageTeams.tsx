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
import type { Team } from '../../shared/schema';
import { suggestTeamId } from '../server/apply.js';
import { getState, renameTeam, saveTeam, type AdminState } from '../api';

export default function ManageTeams() {
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

  const teams = state?.teams.teams ?? [];
  const suggestedId = name.trim() ? suggestTeamId(name, teams.map((t) => t.id)) : '';

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setAddError(null);
    const team: Team = { id: suggestTeamId(trimmed, teams.map((t) => t.id)), name: trimmed };
    try {
      await saveTeam(team);
      setState((prev) =>
        prev ? { ...prev, teams: { teams: [...prev.teams.teams, team] } } : prev,
      );
      setName('');
    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'Failed to save team');
    }
  }

  async function handleRename(id: string) {
    const nextName = (renameValues[id] ?? '').trim();
    if (!nextName) return;
    setRenameErrors((prev) => ({ ...prev, [id]: '' }));
    try {
      await renameTeam(id, nextName);
      setState((prev) =>
        prev
          ? {
              ...prev,
              teams: {
                teams: prev.teams.teams.map((team) =>
                  team.id === id ? { ...team, name: nextName } : team,
                ),
              },
            }
          : prev,
      );
    } catch (error) {
      setRenameErrors((prev) => ({
        ...prev,
        [id]: error instanceof Error ? error.message : 'Failed to rename team',
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
        <Typography variant="subtitle1">Add team</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
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
            helperText="Auto-suggested from name"
          />
          <Button variant="contained" onClick={handleAdd} disabled={!name.trim()}>
            Add team
          </Button>
        </Box>
        {addError && <Alert severity="error">{addError}</Alert>}
      </Box>

      <Divider />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="subtitle1">Teams</Typography>
        {teams.length === 0 ? (
          <Typography color="text.secondary">No teams yet.</Typography>
        ) : (
          <List disablePadding>
            {teams.map((team) => (
              <ListItem
                key={team.id}
                disableGutters
                sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
              >
                <Box sx={{ minWidth: 160 }}>
                  <Typography>{team.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {team.id}
                  </Typography>
                </Box>
                <TextField
                  size="small"
                  slotProps={{ htmlInput: { 'aria-label': `New name for ${team.name}` } }}
                  value={renameValues[team.id] ?? team.name}
                  onChange={(event) =>
                    setRenameValues((prev) => ({ ...prev, [team.id]: event.target.value }))
                  }
                />
                <Button
                  size="small"
                  aria-label={`Rename ${team.name}`}
                  onClick={() => handleRename(team.id)}
                >
                  Rename
                </Button>
                {renameErrors[team.id] && (
                  <Alert severity="error" sx={{ flex: '1 1 100%' }}>
                    {renameErrors[team.id]}
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
