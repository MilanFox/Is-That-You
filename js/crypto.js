import { labels } from './labels.js';

const encoder = new TextEncoder();

export const normalize = (p) => p.trim().normalize('NFC');
export const toHex = (b) => Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
export const fromHex = (h) => new Uint8Array(h.match(/.{1,2}/g).map((x) => parseInt(x, 16)));

const sha256 = async (s) => new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(s)));

export const deriveKey = async (passphrase) => {
  const p = normalize(passphrase);
  const salt = await sha256('codewort:v1:' + p);
  const base = await crypto.subtle.importKey('raw', encoder.encode(p), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' },
    base,
    256,
  );
  return new Uint8Array(bits);
};

export const wordFor = async (keyBytes, lang, windowIndex) => {
  const k = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', k, encoder.encode(lang + ':' + windowIndex)));
  const num = ((sig[0] << 24) | (sig[1] << 16) | (sig[2] << 8) | sig[3]) >>> 0;
  return labels[lang][num % labels[lang].length];
};
