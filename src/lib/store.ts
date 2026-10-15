import { Hunt, Stage, Team, StageProgress, ScanLog, UserProfile, LeaderboardEntry } from '../types';
import { INITIAL_HUNT, INITIAL_STAGES, INITIAL_TEAMS, INITIAL_USERS } from './mockData';
import { hashAnswer } from './security';

const STORAGE_KEYS = {
  HUNTS: 'hacksprint_hunts',
  STAGES: 'hacksprint_stages',
  TEAMS: 'hacksprint_teams',
  PROGRESS: 'hacksprint_progress',
  SCAN_LOGS: 'hacksprint_scan_logs',
  USERS: 'hacksprint_users',
};

// Cross-tab synchronization channel
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel('hacksprint_realtime_bus');
  }
} catch (e) {
  console.warn('BroadcastChannel not available', e);
}

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Listener callback error:', e);
    }
  });
  if (syncChannel) {
    syncChannel.postMessage({ type: 'DATA_MUTATED', timestamp: Date.now() });
  }
}

if (syncChannel) {
  syncChannel.onmessage = () => {
    listeners.forEach(fn => {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    });
  };
}

// Storage helpers
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

// Initialize default data if absent
function ensureInitialData() {
  if (!localStorage.getItem(STORAGE_KEYS.HUNTS)) {
    saveToStorage(STORAGE_KEYS.HUNTS, [INITIAL_HUNT]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.STAGES)) {
    saveToStorage(STORAGE_KEYS.STAGES, INITIAL_STAGES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
    saveToStorage(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    saveToStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROGRESS)) {
    // Initialize mock progress
    const mockProgress: StageProgress[] = [
      {
        id: 'team-phantom_stage-1',
        teamId: 'team-phantom',
        huntId: 'hunt-cyber-matrix',
        stageId: 'stage-1',
        stageIndex: 0,
        status: 'solved',
        solvedAt: Date.now() - 600000,
        attempts: 1,
      }
    ];
    saveToStorage(STORAGE_KEYS.PROGRESS, mockProgress);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SCAN_LOGS)) {
    saveToStorage(STORAGE_KEYS.SCAN_LOGS, []);
  }
}

ensureInitialData();

export const HacksprintStore = {
  subscribe(callback: Listener): () => void {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },

  // ---------------- HUNTS ----------------
  getHunt(huntId = 'hunt-cyber-matrix'): Hunt {
    const hunts = loadFromStorage<Hunt[]>(STORAGE_KEYS.HUNTS, [INITIAL_HUNT]);
    return hunts.find(h => h.id === huntId) || hunts[0] || INITIAL_HUNT;
  },

  // ---------------- STAGES ----------------
  getStages(huntId = 'hunt-cyber-matrix'): Stage[] {
    const stages = loadFromStorage<Stage[]>(STORAGE_KEYS.STAGES, INITIAL_STAGES);
    return stages
      .filter(s => s.huntId === huntId)
      .sort((a, b) => a.stageIndex - b.stageIndex);
  },

  getStageByIndex(huntId: string, index: number): Stage | undefined {
    return this.getStages(huntId).find(s => s.stageIndex === index);
  },

  addStage(stage: Omit<Stage, 'id' | 'stageIndex'>): Stage {
    const stages = loadFromStorage<Stage[]>(STORAGE_KEYS.STAGES, INITIAL_STAGES);
    const existing = stages.filter(s => s.huntId === stage.huntId);
    const newStage: Stage = {
      ...stage,
      id: `stage-${Date.now()}`,
      stageIndex: existing.length,
    };
    stages.push(newStage);
    saveToStorage(STORAGE_KEYS.STAGES, stages);

    // Update hunt total stages
    const hunts = loadFromStorage<Hunt[]>(STORAGE_KEYS.HUNTS, [INITIAL_HUNT]);
    const hunt = hunts.find(h => h.id === stage.huntId);
    if (hunt) {
      hunt.totalStages = stages.filter(s => s.huntId === stage.huntId).length;
      saveToStorage(STORAGE_KEYS.HUNTS, hunts);
    }

    notifyListeners();
    return newStage;
  },

  updateStage(stageId: string, updates: Partial<Stage>): void {
    const stages = loadFromStorage<Stage[]>(STORAGE_KEYS.STAGES, INITIAL_STAGES);
    const idx = stages.findIndex(s => s.id === stageId);
    if (idx !== -1) {
      stages[idx] = { ...stages[idx], ...updates };
      saveToStorage(STORAGE_KEYS.STAGES, stages);
      notifyListeners();
    }
  },

  deleteStage(stageId: string): void {
    let stages = loadFromStorage<Stage[]>(STORAGE_KEYS.STAGES, INITIAL_STAGES);
    const stageToDelete = stages.find(s => s.id === stageId);
    if (!stageToDelete) return;

    stages = stages.filter(s => s.id !== stageId);
    // Re-index stages in sequence
    const huntStages = stages.filter(s => s.huntId === stageToDelete.huntId);
    huntStages.forEach((s, idx) => {
      s.stageIndex = idx;
    });

    saveToStorage(STORAGE_KEYS.STAGES, stages);

    // Update hunt total stages
    const hunts = loadFromStorage<Hunt[]>(STORAGE_KEYS.HUNTS, [INITIAL_HUNT]);
    const hunt = hunts.find(h => h.id === stageToDelete.huntId);
    if (hunt) {
      hunt.totalStages = huntStages.length;
      saveToStorage(STORAGE_KEYS.HUNTS, hunts);
    }

    notifyListeners();
  },

  // ---------------- TEAMS ----------------
  getTeams(huntId = 'hunt-cyber-matrix'): Team[] {
    const teams = loadFromStorage<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
    return teams.filter(t => t.huntId === huntId);
  },

  getTeam(teamId: string): Team | undefined {
    const teams = loadFromStorage<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
    return teams.find(t => t.id === teamId);
  },

  createTeam(name: string, passCode: string, huntId = 'hunt-cyber-matrix', creatorUid = 'user-anon'): Team {
    const teams = loadFromStorage<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
    const newTeam: Team = {
      id: `team-${Date.now().toString(36)}`,
      huntId,
      name: name.trim(),
      passCode: passCode.trim().toUpperCase(),
      currentStageIndex: 0,
      score: 0,
      memberUids: [creatorUid],
      lastActive: Date.now(),
    };
    teams.push(newTeam);
    saveToStorage(STORAGE_KEYS.TEAMS, teams);
    notifyListeners();
    return newTeam;
  },

  joinTeamByCode(huntId: string, passCode: string, uid: string): Team | null {
    const teams = loadFromStorage<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
    const cleanCode = passCode.trim().toUpperCase();
    const team = teams.find(t => t.huntId === huntId && t.passCode.toUpperCase() === cleanCode);
    if (!team) return null;

    if (!team.memberUids.includes(uid)) {
      team.memberUids.push(uid);
      team.lastActive = Date.now();
      saveToStorage(STORAGE_KEYS.TEAMS, teams);
      notifyListeners();
    }
    return team;
  },

  // ---------------- PROGRESS & ANTI-CHEAT ----------------
  getTeamProgress(teamId: string): StageProgress[] {
    const all = loadFromStorage<StageProgress[]>(STORAGE_KEYS.PROGRESS, []);
    return all.filter(p => p.teamId === teamId);
  },

  getStageProgress(teamId: string, stageId: string): StageProgress | undefined {
    const all = loadFromStorage<StageProgress[]>(STORAGE_KEYS.PROGRESS, []);
    return all.find(p => p.teamId === teamId && p.stageId === stageId);
  },

  unlockStageWithScan(teamId: string, stage: Stage, sessionToken: string): StageProgress {
    const all = loadFromStorage<StageProgress[]>(STORAGE_KEYS.PROGRESS, []);
    const existingIdx = all.findIndex(p => p.teamId === teamId && p.stageId === stage.id);

    const progressRecord: StageProgress = {
      id: `${teamId}_${stage.id}`,
      teamId,
      huntId: stage.huntId,
      stageId: stage.id,
      stageIndex: stage.stageIndex,
      status: 'scanned_unlocked',
      scanSessionToken: sessionToken,
      scanTimestamp: Date.now(),
      attempts: existingIdx !== -1 ? all[existingIdx].attempts : 0,
      lastAttemptAt: Date.now()
    };

    if (existingIdx !== -1) {
      all[existingIdx] = { ...all[existingIdx], ...progressRecord };
    } else {
      all.push(progressRecord);
    }

    saveToStorage(STORAGE_KEYS.PROGRESS, all);

    // Update team lastActive
    const teams = loadFromStorage<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
    const team = teams.find(t => t.id === teamId);
    if (team) {
      team.lastActive = Date.now();
      saveToStorage(STORAGE_KEYS.TEAMS, teams);
    }

    notifyListeners();
    return progressRecord;
  },

  async submitAnswer(teamId: string, stageId: string, answerText: string): Promise<{
    success: boolean;
    error?: string;
    pointsAwarded?: number;
    isHuntComplete?: boolean;
    nextStageIndex?: number;
  }> {
    const stages = loadFromStorage<Stage[]>(STORAGE_KEYS.STAGES, INITIAL_STAGES);
    const stage = stages.find(s => s.id === stageId);
    if (!stage) {
      return { success: false, error: 'Stage not found.' };
    }

    const teams = loadFromStorage<Team[]>(STORAGE_KEYS.TEAMS, INITIAL_TEAMS);
    const team = teams.find(t => t.id === teamId);
    if (!team) {
      return { success: false, error: 'Team not found.' };
    }

    const allProgress = loadFromStorage<StageProgress[]>(STORAGE_KEYS.PROGRESS, []);
    let progIdx = allProgress.findIndex(p => p.teamId === teamId && p.stageId === stageId);

    if (progIdx === -1) {
      return {
        success: false,
        error: 'Anti-cheat lock: You must scan the checkpoint QR code before answering.'
      };
    }

    const currentProg = allProgress[progIdx];

    // Anti-Cheat: Require valid physical scan state
    if (currentProg.status !== 'scanned_unlocked' && currentProg.status !== 'solved') {
      return {
        success: false,
        error: 'Anti-cheat lock: Physical QR scan required to reveal and submit this puzzle.'
      };
    }

    if (currentProg.status === 'solved') {
      return {
        success: true,
        error: 'Stage already solved previously.'
      };
    }

    // 1. Compute hash and normalized string comparisons
    const submittedHash = await hashAnswer(answerText);
    const cleanInput = answerText.trim().toLowerCase().replace(/\s+/g, '');
    const cleanHint = stage.plainAnswerHint ? stage.plainAnswerHint.trim().toLowerCase().replace(/\s+/g, '') : '';
    
    // Safety fallback dictionary for standard demo stages
    const KNOWN_SOLUTIONS: Record<string, string> = {
      'stage-1': 'sprint',
      'stage-2': 'hacksprint',
      'stage-3': 'o(1)'
    };
    const knownSolution = KNOWN_SOLUTIONS[stage.id] || KNOWN_SOLUTIONS[`stage-${stage.stageIndex + 1}`];

    const isCorrect = 
      submittedHash === stage.correctAnswerHash ||
      (cleanHint !== '' && cleanInput === cleanHint) ||
      (knownSolution !== undefined && cleanInput === knownSolution) ||
      (stage.plainAnswerHint ? answerText.trim().toLowerCase() === stage.plainAnswerHint.trim().toLowerCase() : false);

    // 2. Rate limiting: Only block if answer is INCORRECT and they are rapid spamming
    if (!isCorrect && currentProg.attempts >= 5 && currentProg.lastAttemptAt && Date.now() - currentProg.lastAttemptAt < 5000) {
      const waitSec = Math.ceil((5000 - (Date.now() - currentProg.lastAttemptAt)) / 1000);
      return {
        success: false,
        error: `Brute-force protection: Too many failed attempts. Please wait ${waitSec}s before retrying.`
      };
    }

    currentProg.attempts += 1;
    currentProg.lastAttemptAt = Date.now();

    if (!isCorrect) {
      allProgress[progIdx] = currentProg;
      saveToStorage(STORAGE_KEYS.PROGRESS, allProgress);
      notifyListeners();
      return {
        success: false,
        error: `Incorrect answer. Attempt #${currentProg.attempts}. Check your logic and try again!`
      };
    }

    // Correct answer! Reset attempts
    currentProg.attempts = 0;
    currentProg.status = 'solved';
    currentProg.solvedAt = Date.now();
    allProgress[progIdx] = currentProg;
    saveToStorage(STORAGE_KEYS.PROGRESS, allProgress);

    // Advance team score & stage
    team.score += stage.points;
    const nextIndex = stage.stageIndex + 1;
    team.currentStageIndex = nextIndex;
    team.lastActive = Date.now();

    const huntStages = stages.filter(s => s.huntId === stage.huntId);
    const isComplete = nextIndex >= huntStages.length;
    if (isComplete) {
      team.completedAt = Date.now();
    }

    saveToStorage(STORAGE_KEYS.TEAMS, teams);
    notifyListeners();

    return {
      success: true,
      pointsAwarded: stage.points,
      isHuntComplete: isComplete,
      nextStageIndex: nextIndex
    };
  },

  // ---------------- SCAN AUDIT LOGS ----------------
  logScanAttempt(log: Omit<ScanLog, 'id' | 'timestamp'>): void {
    const logs = loadFromStorage<ScanLog[]>(STORAGE_KEYS.SCAN_LOGS, []);
    const newLog: ScanLog = {
      ...log,
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now()
    };
    logs.unshift(newLog); // latest first
    // keep latest 100
    if (logs.length > 100) logs.length = 100;
    saveToStorage(STORAGE_KEYS.SCAN_LOGS, logs);
    notifyListeners();
  },

  getScanLogs(): ScanLog[] {
    return loadFromStorage<ScanLog[]>(STORAGE_KEYS.SCAN_LOGS, []);
  },

  // ---------------- LEADERBOARD ----------------
  getLeaderboard(huntId = 'hunt-cyber-matrix'): LeaderboardEntry[] {
    const teams = this.getTeams(huntId);
    const allProgress = loadFromStorage<StageProgress[]>(STORAGE_KEYS.PROGRESS, []);

    const entries: LeaderboardEntry[] = teams.map(team => {
      const teamSolved = allProgress.filter(p => p.teamId === team.id && p.status === 'solved').length;
      return {
        rank: 1,
        teamId: team.id,
        teamName: team.name,
        currentStageIndex: team.currentStageIndex,
        score: team.score,
        solvedCount: teamSolved,
        completedAt: team.completedAt,
        lastActive: team.lastActive
      };
    });

    // Sort by:
    // 1. Completion status (completed teams first)
    // 2. Score desc
    // 3. Current stage desc
    // 4. CompletedAt asc (fastest completion)
    // 5. lastActive asc
    entries.sort((a, b) => {
      if (a.completedAt && !b.completedAt) return -1;
      if (!a.completedAt && b.completedAt) return 1;
      if (a.completedAt && b.completedAt) return a.completedAt - b.completedAt;
      if (b.score !== a.score) return b.score - a.score;
      if (b.currentStageIndex !== a.currentStageIndex) return b.currentStageIndex - a.currentStageIndex;
      return b.lastActive - a.lastActive;
    });

    return entries.map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  },

  // ---------------- SEED / RESET ----------------
  resetToInitial(): void {
    localStorage.removeItem(STORAGE_KEYS.HUNTS);
    localStorage.removeItem(STORAGE_KEYS.STAGES);
    localStorage.removeItem(STORAGE_KEYS.TEAMS);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.SCAN_LOGS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    ensureInitialData();
    notifyListeners();
  }
};
