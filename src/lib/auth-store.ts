// ============================================
// Tabi Note - 認証ストア (Zustand)
// 要件定義書 F-13, 9.2 に準拠
// PIN認証 + 15日セッション
// ============================================

import { create } from 'zustand';
import { encrypt, decrypt, getDeviceId } from './crypto';
import type { EncryptedData } from './crypto';

const PIN_HASH_KEY = 'tabi_note_pin_check';
const SESSION_KEY = 'tabi_note_session';
const FAILED_ATTEMPTS_KEY = 'tabi_note_failed_attempts';
const LOCKOUT_KEY = 'tabi_note_lockout_until';

const SESSION_DAYS = 15;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

const CHECK_STRING = 'tabi_note_unlock_check';

interface SessionData {
  deviceId: string;
  unlockedAt: string;
  expiresAt: string;
}

interface AuthState {
  isLocked: boolean;
  isPinSet: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;

  init: () => void;
  setupPin: (pin: string) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  isSessionValid: () => boolean;
}

function getStoredEncrypted(): EncryptedData | null {
  const raw = localStorage.getItem(PIN_HASH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EncryptedData;
  } catch {
    return null;
  }
}

function saveSession(): void {
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const session: SessionData = {
    deviceId: getDeviceId(),
    unlockedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadSession(): SessionData | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLocked: true,
  isPinSet: false,
  failedAttempts: 0,
  lockoutUntil: null,

  init: () => {
    const hasPin = getStoredEncrypted() !== null;
    const failedRaw = localStorage.getItem(FAILED_ATTEMPTS_KEY);
    const lockoutRaw = localStorage.getItem(LOCKOUT_KEY);

    const failedAttempts = failedRaw ? parseInt(failedRaw, 10) : 0;
    const lockoutUntil = lockoutRaw ? parseInt(lockoutRaw, 10) : null;

    const sessionValid = get().isSessionValid();

    set({
      isPinSet: hasPin,
      isLocked: !sessionValid,
      failedAttempts,
      lockoutUntil,
    });
  },

  setupPin: async (pin: string) => {
    const encrypted = await encrypt(CHECK_STRING, pin);
    localStorage.setItem(PIN_HASH_KEY, JSON.stringify(encrypted));
    saveSession();
    set({ isPinSet: true, isLocked: false, failedAttempts: 0 });
  },

  unlock: async (pin: string) => {
    const state = get();

    if (state.lockoutUntil && Date.now() < state.lockoutUntil) {
      return false;
    }

    const encrypted = getStoredEncrypted();
    if (!encrypted) return false;

    try {
      const decrypted = await decrypt(encrypted, pin);
      if (decrypted === CHECK_STRING) {
        saveSession();
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
        localStorage.removeItem(LOCKOUT_KEY);
        set({ isLocked: false, failedAttempts: 0, lockoutUntil: null });
        return true;
      }
      return false;
    } catch {
      const newAttempts = state.failedAttempts + 1;
      localStorage.setItem(FAILED_ATTEMPTS_KEY, String(newAttempts));

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
        localStorage.setItem(LOCKOUT_KEY, String(until));
        set({ failedAttempts: newAttempts, lockoutUntil: until });
      } else {
        set({ failedAttempts: newAttempts });
      }
      return false;
    }
  },

  lock: () => {
    clearSession();
    set({ isLocked: true });
  },

  changePin: async (oldPin: string, newPin: string) => {
    const encrypted = getStoredEncrypted();
    if (!encrypted) return false;

    try {
      const decrypted = await decrypt(encrypted, oldPin);
      if (decrypted !== CHECK_STRING) return false;

      const newEncrypted = await encrypt(CHECK_STRING, newPin);
      localStorage.setItem(PIN_HASH_KEY, JSON.stringify(newEncrypted));
      return true;
    } catch {
      return false;
    }
  },

  isSessionValid: () => {
    const session = loadSession();
    if (!session) return false;
    const expiresAt = new Date(session.expiresAt).getTime();
    return Date.now() < expiresAt;
  },
}));