// ============================================
// Tabi Note - 暗号化ユーティリティ
// 要件定義書 9.3 に準拠
// PBKDF2 (鍵導出) + AES-256-GCM (暗号化)
// ============================================

const PBKDF2_ITERATIONS = 600000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

/**
 * PINからAES-256鍵を導出する
 */
export async function deriveKey(
  pin: string,
  salt: ArrayBuffer
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const pinBytes = encoder.encode(pin);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    pinBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 暗号化結果の構造
 */
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

/**
 * ランダムなArrayBufferを生成
 */
function randomBytes(length: number): ArrayBuffer {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes.buffer;
}

/**
 * データを暗号化する
 */
export async function encrypt(
  plaintext: string,
  pin: string
): Promise<EncryptedData> {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  const key = await deriveKey(pin, salt);
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );

  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
  };
}

/**
 * データを復号する
 */
export async function decrypt(
  encrypted: EncryptedData,
  pin: string
): Promise<string> {
  const salt = base64ToBuffer(encrypted.salt);
  const iv = base64ToBuffer(encrypted.iv);
  const ciphertext = base64ToBuffer(encrypted.ciphertext);

  const key = await deriveKey(pin, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * ArrayBuffer を Base64 文字列に変換
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 文字列を ArrayBuffer に変換
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 端末ID(セッション管理用)
 */
export function getDeviceId(): string {
  const KEY = 'tabi_note_device_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}