import { labels } from './labels.js';

const encoder = new TextEncoder();

export const normalize = (passphrase) => passphrase.trim().normalize('NFC');
export const toHex = (bytes) => Array.from(bytes).map((x) => x.toString(16).padStart(2, '0')).join('');
export const fromHex = (hex) => new Uint8Array(hex.match(/.{1,2}/g).map((x) => parseInt(x, 16)));

const sha256 = async (string) => new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(string)));

export const deriveKey = async (passphrase) => {
  const pass = normalize(passphrase);
  const salt = await sha256('codewort:v1:' + pass);
  const base = await crypto.subtle.importKey('raw', encoder.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
    base,
    256,
  );
  return new Uint8Array(bits);
};

export const wordFor = async (keyBytes, lang, windowIndex) => {
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(lang + ':' + windowIndex)));
  const num = ((sig[0] << 24) | (sig[1] << 16) | (sig[2] << 8) | sig[3]) >>> 0;
  return labels[lang][num % labels[lang].length];
};
