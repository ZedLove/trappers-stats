import type { Game, PlayersFile, SeasonFile, TeamsFile } from './schema';

export function validateData(input: {
  players: PlayersFile;
  teams: TeamsFile;
  seasons: Record<string, SeasonFile>;
}): string[] {
  const issues: string[] = [];

  try {
    const playerIds = new Set(input.players.players.map((player) => player.id));
    const playerNames = new Set<string>();
    input.players.players.forEach((player) => {
      if (playerNames.has(player.name)) {
        issues.push(`Duplicate player display name "${player.name}"`);
      }
      playerNames.add(player.name);
    });

    const teamIds = new Set(input.teams.teams.map((team) => team.id));
    const usTeams = input.teams.teams.filter((team) => team.us === true);
    if (usTeams.length !== 1) {
      issues.push(`Expected exactly one us team, found ${usTeams.length}`);
    }
    const usTeamId = usTeams[0]?.id;

    Object.entries(input.seasons).forEach(([seasonKey, season]) => {
      if (seasonKey !== String(season.season)) {
        issues.push(`Season key "${seasonKey}" does not match season ${season.season}`);
      }

      season.games.forEach((game) => {
        if (!teamIds.has(game.opponentId)) {
          issues.push(`Game "${game.id}" references unknown opponent team "${game.opponentId}"`);
        }
        if (game.opponentId === usTeamId) {
          issues.push(`Game "${game.id}" opponent cannot be the us team "${game.opponentId}"`);
        }
        game.lines.forEach((line) => {
          if (!playerIds.has(line.playerId)) {
            issues.push(`Game "${game.id}" references unknown player "${line.playerId}"`);
          }
        });
      });

      season.results?.standings.forEach((standing) => {
        if (!teamIds.has(standing.teamId)) {
          issues.push(`Season ${season.season} standings reference unknown team "${standing.teamId}"`);
        }
      });
      season.results?.playoffs.forEach((matchup) => {
        for (const teamId of [matchup.teamA, matchup.teamB, matchup.winner]) {
          if (teamId !== undefined && !teamIds.has(teamId)) {
            issues.push(`Season ${season.season} playoffs reference unknown team "${teamId}"`);
          }
        }
      });
    });
  } catch {
    return ['Unable to validate malformed data'];
  }

  return issues;
}

export function gameWarnings(game: Game): string[] {
  try {
    const warnings: string[] = [];
    const lineRuns = game.lines.reduce((total, line) => total + line.r, 0);
    if (lineRuns !== game.score.us) {
      warnings.push(`Player-line runs (${lineRuns}) do not match team score (${game.score.us})`);
    }
    if (game.lines.length < 5) {
      warnings.push(`Game has fewer than five player lines (${game.lines.length})`);
    }
    return warnings;
  } catch {
    return ['Unable to check warnings for malformed game'];
  }
}
