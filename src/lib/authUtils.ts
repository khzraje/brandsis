// Utility functions for auth hashing and constants
export const CREDENTIAL_HASH = '5ecf056f2937e93c214984ca94c0ce6e4419449300e7fb519581cbb5d2bbf1b5';

export async function sha256Hex(input: string) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
