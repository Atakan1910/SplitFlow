/**
 * URL State paylaşım: JSON → Base64 → URL hash
 * ve tersi: URL hash → Base64 → JSON
 */

import type { AppState } from '../types/expense';

/** State'i Base64 URL hash'e dönüştürür */
export function stateToUrlHash(state: AppState): string {
  try {
    const json = JSON.stringify(state);
    // TextEncoder ile UTF-8 byte'lara dönüştür, sonra Base64
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    return `#data=${encodeURIComponent(b64)}`;
  } catch {
    return '';
  }
}

/** URL hash'ten state'i çözer (yoksa null döner) */
export function urlHashToState(hash: string): AppState | null {
  try {
    if (!hash.startsWith('#data=')) return null;
    const b64 = decodeURIComponent(hash.slice(6));
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as AppState;
    // Temel doğrulama
    if (parsed.groups && parsed.activeGroupId) return parsed;
  } catch {
    // Geçersiz veri
  }
  return null;
}

/** Tam URL'i oluşturur */
export function generateShareUrl(state: AppState): string {
  const base = window.location.href.split('#')[0];
  return base + stateToUrlHash(state);
}
