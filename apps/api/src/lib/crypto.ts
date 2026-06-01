import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

function getKey(): Buffer {
  const keyHex = process.env['ENCRYPTION_KEY'];
  if (!keyHex || keyHex.length < 64) {
    // In dev without a key, use a static fallback (not for production)
    return Buffer.from('dev-fallback-key-do-not-use-in-prod-00000000'.padEnd(64, '0').slice(0, 64), 'hex');
  }
  return Buffer.from(keyHex.slice(0, 64), 'hex');
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const data = Buffer.from(ciphertext, 'base64');
  const iv = data.subarray(0, 16);
  const tag = data.subarray(16, 32);
  const encrypted = data.subarray(32);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function safeDecrypt(ciphertext: string): string {
  try {
    if (!ciphertext) return '';
    // If it looks like it's not encrypted (plain text API keys starting with sk-)
    if (ciphertext.startsWith('sk-') || ciphertext.startsWith('ant')) return ciphertext;
    return decrypt(ciphertext);
  } catch {
    return ciphertext;
  }
}
