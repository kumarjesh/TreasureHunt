import { Hunt, Stage, Team, UserProfile, StageProgress, ScanLog } from '../types';

export const INITIAL_HUNT: Hunt = {
  id: 'hunt-cyber-matrix',
  title: 'CYBER MATRIX 2026',
  description: 'The annual high-velocity digital treasure hunt. Solve crypto challenges, locate physical checkpoints, and claim victory.',
  organizerId: 'org-admin-1',
  isActive: true,
  totalStages: 3,
  createdAt: Date.now() - 3600000,
};

// SHA-256 precomputations for normalized strings:
// 'sprint' -> 'fb9afa84739c3239a0f5a57153fa5e9e2367f1adb4d2ef9a2c47f2cba31a74b0'
// 'hacksprint' -> '6e7935681cf91c806595c2bc83cfb50126b05271a487c92699be26ca7310eaa3'
// 'o(1)' -> '79a6652f8ffde77c2c086d624deecf37bc75cfca76ff51daab0dc2ddc8d20ff7'

export const INITIAL_STAGES: Stage[] = [
  {
    id: 'stage-1',
    huntId: 'hunt-cyber-matrix',
    stageIndex: 0,
    title: 'The Binary Gateway',
    clue: 'Locate the main server hub or registration counter. Search for the neon green checkpoint labeled [GATEWAY-01].',
    puzzleQuestion: 'Decode this 8-bit binary stream to reveal the password:\n01010011 01010000 01010010 01001001 01001110 01010100',
    puzzleType: 'text',
    correctAnswerHash: 'fb9afa84739c3239a0f5a57153fa5e9e2367f1adb4d2ef9a2c47f2cba31a74b0',
    plainAnswerHint: 'sprint',
    qrSecretToken: 'HS_SEC_ALPHA_8892',
    points: 100,
    locationHint: 'Near the server rack entrance'
  },
  {
    id: 'stage-2',
    huntId: 'hunt-cyber-matrix',
    stageIndex: 1,
    title: 'The Quantum Enigma',
    clue: 'Proceed to the hardware makerspace workbench where microcontrollers and soldering irons are stored.',
    puzzleQuestion: 'A corrupted transmission was intercepted, shifted forward by 3 letters in Caesar Cipher:\n"KDFNV SULQW"\nReverse the cipher by 3 letters to decode the codeword (without spaces).',
    puzzleType: 'text',
    correctAnswerHash: '6e7935681cf91c806595c2bc83cfb50126b05271a487c92699be26ca7310eaa3',
    plainAnswerHint: 'hacksprint',
    qrSecretToken: 'HS_SEC_BETA_4419',
    points: 200,
    locationHint: 'Under the LED oscilloscope station'
  },
  {
    id: 'stage-3',
    huntId: 'hunt-cyber-matrix',
    stageIndex: 2,
    title: 'The Core Terminal',
    clue: 'Ascend to the Main Presentation Arena podium near the central projector control desk.',
    puzzleQuestion: 'What is the average time complexity of a hash table lookup operation in Big-O notation?\n(Format example: O(1))',
    puzzleType: 'text',
    correctAnswerHash: '79a6652f8ffde77c2c086d624deecf37bc75cfca76ff51daab0dc2ddc8d20ff7',
    plainAnswerHint: 'o(1)',
    qrSecretToken: 'HS_SEC_GAMMA_7731',
    points: 300,
    locationHint: 'Side of the projector control console'
  }
];

export const INITIAL_TEAMS: Team[] = [
  {
    id: 'team-phantom',
    huntId: 'hunt-cyber-matrix',
    name: 'Phantom Squad',
    passCode: '7741',
    currentStageIndex: 1,
    score: 100,
    memberUids: ['user-phantom-1', 'user-phantom-2'],
    lastActive: Date.now() - 600000
  },
  {
    id: 'team-glitch',
    huntId: 'hunt-cyber-matrix',
    name: 'Glitch Runners',
    passCode: '3398',
    currentStageIndex: 0,
    score: 0,
    memberUids: ['user-glitch-1'],
    lastActive: Date.now() - 1200000
  }
];

export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'org-admin-1',
    email: 'organizer@hacksprint.dev',
    displayName: 'Chief Hunt Director',
    role: 'organizer',
    createdAt: Date.now() - 86400000
  },
  {
    uid: 'participant-demo-1',
    email: 'hacker@team.dev',
    displayName: 'CyberHunter',
    role: 'participant',
    teamId: 'team-cyber',
    createdAt: Date.now() - 7200000
  }
];
