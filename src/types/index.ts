export type TeamColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export interface HoleScore {
  score: number | null;
  shotguns: 0 | 1 | 2;
}

// Keyed by teamId ('team0' | 'team1' | 'team2')
export type HoleScores = Record<string, HoleScore>;

export interface Hole {
  number: number; // 1–18
  par: number;
  scores: HoleScores;
}

export interface Team {
  id: string; // 'team0' | 'team1' | 'team2'
  name: string;
  color: TeamColor;
  players: string[]; // exactly 4
}

export type RoundStatus = 'setup' | 'lobby' | 'active' | 'completed';

export interface Round {
  id: string;
  name: string;
  courseName: string;
  joinCode: string;
  status: RoundStatus;
  createdAt: number;
  teams: Team[];
  holes: Hole[]; // length 18, index 0 = hole 1
  // Maps teamId to the deviceId that joined as scorer
  scorers: Record<string, string>;
}

// Leaderboard row computed from Round data
export interface LeaderboardRow {
  team: Team;
  totalScore: number;
  toPar: number;
  front9: number;
  back9: number;
  totalShotguns: number;
  holesPlayed: number;
}

// Stored per device in localStorage
export interface DeviceState {
  deviceId: string;
  // Maps roundId -> teamId (which team this device scores for)
  teamAssignments: Record<string, string>;
}
