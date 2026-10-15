import { Stage, Team } from '../types';

/**
 * Computes SHA-256 hex digest of a normalized answer string
 */
export async function hashAnswer(answer: string): Promise<string> {
  const normalized = answer.trim().toLowerCase().replace(/\s+/g, ' ');
  const msgUint8 = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface QRPayload {
  prefix: 'HACKSPRINT';
  huntId: string;
  stageId: string;
  stageIndex: number;
  secret: string;
  ts?: number;
}

/**
 * Formats a payload for QR code generation
 */
export function encodeQRPayload(huntId: string, stageId: string, stageIndex: number, qrSecretToken: string): string {
  const payload: QRPayload = {
    prefix: 'HACKSPRINT',
    huntId,
    stageId,
    stageIndex,
    secret: qrSecretToken,
    ts: Date.now()
  };
  return JSON.stringify(payload);
}

/**
 * Safely parses and validates a scanned QR payload
 */
export function decodeQRPayload(rawText: string): QRPayload | null {
  try {
    const trimmed = rawText.trim();
    // Try JSON
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const parsed = JSON.parse(trimmed);
      if (parsed.prefix === 'HACKSPRINT' && parsed.huntId && parsed.stageId !== undefined && parsed.stageIndex !== undefined && parsed.secret) {
        return {
          prefix: 'HACKSPRINT',
          huntId: String(parsed.huntId),
          stageId: String(parsed.stageId),
          stageIndex: Number(parsed.stageIndex),
          secret: String(parsed.secret),
          ts: parsed.ts ? Number(parsed.ts) : undefined
        };
      }
    }

    // Try pipe-delimited format: HACKSPRINT|huntId|stageId|stageIndex|secret
    if (trimmed.startsWith('HACKSPRINT|')) {
      const parts = trimmed.split('|');
      if (parts.length >= 5) {
        return {
          prefix: 'HACKSPRINT',
          huntId: parts[1],
          stageId: parts[2],
          stageIndex: parseInt(parts[3], 10),
          secret: parts[4]
        };
      }
    }

    return null;
  } catch (err) {
    console.error('Failed to parse QR payload:', err);
    return null;
  }
}

/**
 * Generates an anti-cheat session token bound to the current scan event
 */
export function generateScanSessionToken(teamId: string, stageId: string): string {
  const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2) + Date.now().toString(36);
  return `HST_${teamId}_${stageId}_${randomPart}_${Date.now()}`;
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
  stage?: Stage;
  sessionToken?: string;
}

/**
 * Anti-Cheat Verification Engine:
 * Validates stage sequence, physical scan secret, and team status.
 */
export function verifyScanEligibility(
  team: Team,
  payload: QRPayload,
  stages: Stage[]
): VerificationResult {
  // Check hunt identity
  if (team.huntId !== payload.huntId) {
    return {
      valid: false,
      error: 'Invalid Hunt: This QR checkpoint belongs to a different competition.'
    };
  }

  // Find target stage
  const targetStage = stages.find(s => s.id === payload.stageId || s.stageIndex === payload.stageIndex);
  if (!targetStage) {
    return {
      valid: false,
      error: 'Unrecognized Checkpoint: This stage does not exist in the active hunt.'
    };
  }

  // 1. Anti-Cheat: Sequence Guard (Cannot skip ahead)
  if (payload.stageIndex > team.currentStageIndex) {
    return {
      valid: false,
      error: `[ANTI-CHEAT VIOLATION] Sequence bypassed! You scanned Stage ${payload.stageIndex + 1}, but your team is currently on Stage ${team.currentStageIndex + 1}. You must physically locate and solve Stage ${team.currentStageIndex + 1} first.`
    };
  }

  // 2. Already cleared stage check
  if (payload.stageIndex < team.currentStageIndex) {
    return {
      valid: false,
      error: `Stage ${payload.stageIndex + 1} has already been solved by your team! Follow the next clue to reach Stage ${team.currentStageIndex + 1}.`
    };
  }

  // 3. Secret Nonce check (Prevents guessing or forged QR codes)
  if (payload.secret !== targetStage.qrSecretToken) {
    return {
      valid: false,
      error: '[ANTI-CHEAT ALERT] Tampered or expired QR code token detected. Scan rejected.'
    };
  }

  // All guards passed: Issue fresh session token
  const sessionToken = generateScanSessionToken(team.id, targetStage.id);

  return {
    valid: true,
    stage: targetStage,
    sessionToken
  };
}
