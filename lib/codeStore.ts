// Shared in-memory verification code store (singleton across API routes)
interface CodeEntry { code: string; expires: number; }
const store = new Map<string, CodeEntry>();

export function setCode(email: string, code: string, ttlMinutes = 10) {
  store.set(email, { code, expires: Date.now() + ttlMinutes * 60 * 1000 });
}

export function verifyCode(email: string, code: string): boolean {
  const entry = store.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expires) { store.delete(email); return false; }
  if (entry.code !== code) return false;
  store.delete(email);
  return true;
}

// For activation codes
export function setActivationCode(code: string, credits = 8, ttlDays = 30) {
  store.set(`activation:${code}`, { code: String(credits), expires: Date.now() + ttlDays * 24 * 60 * 60 * 1000 });
}

export function redeemActivationCode(code: string): number | null {
  const entry = store.get(`activation:${code}`);
  if (!entry) return null;
  if (Date.now() > entry.expires) { store.delete(`activation:${code}`); return null; }
  const credits = parseInt(entry.code, 10);
  store.delete(`activation:${code}`);
  return credits;
}

// For referral tracking during registration
const referralStore = new Map<string, string>();

export function setReferral(email: string, referralCode: string) {
  referralStore.set(email, referralCode);
}

export function getReferral(email: string): string | null {
  const code = referralStore.get(email);
  referralStore.delete(email);
  return code || null;
}
