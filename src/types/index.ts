export type UserRole = 'participant' | 'organizer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  teamId?: string;
  createdAt: number;
}

export interface Hunt {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  isActive: boolean;
  totalStages: number;
  createdAt: number;
}

export type PuzzleType = 'text' | 'number' | 'choice' | 'code';

export interface Stage {
  id: string;
  huntId: string;
  stageIndex: number; // 0, 1, 2...
  title: string;
  clue: string; // Physical location clue to find the QR
  puzzleQuestion: string; // The challenge once QR is scanned
  puzzleType: PuzzleType;
  options?: string[]; // Multiple choice options if applicable
  correctAnswerHash: string; // SHA-256 hashed lowercase string
  plainAnswerHint?: string; // For organizer preview
  qrSecretToken: string; // Cryptographic nonce for this checkpoint
  points: number;
  locationHint?: string;
}

export interface Team {
  id: string;
  huntId: string;
  name: string;
  passCode: string; // 4-char join code
  currentStageIndex: number;
  score: number;
  memberUids: string[];
  completedAt?: number;
  lastActive: number;
}

export type StageProgressStatus = 'locked' | 'scanned_unlocked' | 'solved';

export interface StageProgress {
  id: string; // `${teamId}_${stageId}`
  teamId: string;
  huntId: string;
  stageId: string;
  stageIndex: number;
  status: StageProgressStatus;
  scanSessionToken?: string;
  scanTimestamp?: number;
  solvedAt?: number;
  attempts: number;
  lastAttemptAt?: number;
}

export interface ScanLog {
  id: string;
  teamId: string;
  stageId: string;
  stageIndex: number;
  userId: string;
  timestamp: number;
  isValid: boolean;
  reason?: string;
  clientNonce: string;
}

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  currentStageIndex: number;
  score: number;
  solvedCount: number;
  completedAt?: number;
  lastActive: number;
}
