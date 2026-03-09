import type { Round, Hole, LeaderboardRow, Team, TeamColor } from '../types';

/** Generate a 6-character alphanumeric join code */
export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Generate a stable unique ID */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Standard golf par values for a typical 18-hole course */
export const DEFAULT_PARS: number[] = [4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4];

export const TEAM_COLORS: { value: TeamColor; label: string; bg: string; text: string; border: string; dot: string }[] = [
  { value: 'red',    label: 'Red',    bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-300',    dot: 'bg-red-500' },
  { value: 'blue',   label: 'Blue',   bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-300',   dot: 'bg-blue-500' },
  { value: 'green',  label: 'Green',  bg: 'bg-fairway-50',text: 'text-fairway-700',border: 'border-fairway-300',dot: 'bg-fairway-500' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300', dot: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
];

export function getTeamColor(color: TeamColor) {
  return TEAM_COLORS.find((c) => c.value === color) ?? TEAM_COLORS[0];
}

/** Build the initial 18-hole array */
export function buildInitialHoles(pars: number[]): Hole[] {
  return pars.map((par, i) => ({
    number: i + 1,
    par,
    scores: {
      team0: { score: null, shotguns: 0 },
      team1: { score: null, shotguns: 0 },
      team2: { score: null, shotguns: 0 },
    },
  }));
}

/** Compute leaderboard rows sorted by total score ascending */
export function computeLeaderboard(round: Round): LeaderboardRow[] {
  return round.teams
    .map((team) => {
      let total = 0;
      let totalPar = 0;
      let front9 = 0;
      let back9 = 0;
      let shotguns = 0;
      let played = 0;

      round.holes.forEach((hole, i) => {
        const ts = hole.scores[team.id];
        if (ts?.score != null) {
          total += ts.score;
          totalPar += hole.par;
          played++;
          if (i < 9) front9 += ts.score;
          else back9 += ts.score;
        }
        if (ts?.shotguns) shotguns += ts.shotguns;
      });

      return {
        team,
        totalScore: total,
        toPar: total - totalPar,
        front9,
        back9,
        totalShotguns: shotguns,
        holesPlayed: played,
      };
    })
    .sort((a, b) => {
      if (a.holesPlayed === 0 && b.holesPlayed === 0) return 0;
      if (a.holesPlayed === 0) return 1;
      if (b.holesPlayed === 0) return -1;
      return a.totalScore - b.totalScore;
    });
}

/** Format a score relative to par */
export function formatToPar(toPar: number): string {
  if (toPar === 0) return 'E';
  if (toPar > 0) return `+${toPar}`;
  return `${toPar}`;
}

/** Pad join code input to uppercase */
export function normalizeCode(code: string): string {
  return code.toUpperCase().trim().replace(/[^A-Z0-9]/g, '');
}

/** Total par for holes array */
export function totalPar(holes: Hole[]): number {
  return holes.reduce((sum, h) => sum + h.par, 0);
}

/** Get or create a stable deviceId from localStorage */
export function getDeviceId(): string {
  const key = 'golf_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = generateId();
    localStorage.setItem(key, id);
  }
  return id;
}

/** Pluralize a word */
export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/** Convert Round to a plain object safe for Firestore */
export function roundToDoc(round: Round): Record<string, unknown> {
  return { ...round };
}

/** Default team definitions used during round creation */
export function defaultTeams(): Team[] {
  const colors: TeamColor[] = ['red', 'blue', 'green'];
  return ['Team A', 'Team B', 'Team C'].map((name, i) => ({
    id: `team${i}`,
    name,
    color: colors[i],
    players: ['', '', '', ''],
  }));
}
