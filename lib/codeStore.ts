import { prisma } from "@/lib/prisma";

// ─── Email Verification Codes ────────────────────────────────────────────────

export async function setCode(email: string, code: string, ttlMinutes = 10) {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  await prisma.verificationCode.upsert({
    where: { key: `verify:${email}` },
    update: { value: code, expiresAt },
    create: { key: `verify:${email}`, value: code, expiresAt },
  });
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const entry = await prisma.verificationCode.findUnique({
    where: { key: `verify:${email}` },
  });
  if (!entry) return false;
  if (new Date() > entry.expiresAt) {
    await prisma.verificationCode.delete({ where: { key: `verify:${email}` } });
    return false;
  }
  if (entry.value !== code) return false;
  await prisma.verificationCode.delete({ where: { key: `verify:${email}` } });
  return true;
}

// ─── Activation Codes ────────────────────────────────────────────────────────

export async function setActivationCode(code: string, credits = 8, ttlDays = 30) {
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
  await prisma.verificationCode.upsert({
    where: { key: `activation:${code}` },
    update: { value: String(credits), expiresAt },
    create: { key: `activation:${code}`, value: String(credits), expiresAt },
  });
}

export async function redeemActivationCode(code: string): Promise<number | null> {
  const entry = await prisma.verificationCode.findUnique({
    where: { key: `activation:${code}` },
  });
  if (!entry) return null;
  if (new Date() > entry.expiresAt) {
    await prisma.verificationCode.delete({ where: { key: `activation:${code}` } });
    return null;
  }
  const credits = parseInt(entry.value, 10);
  await prisma.verificationCode.delete({ where: { key: `activation:${code}` } });
  return credits;
}

// ─── Referral Tracking ───────────────────────────────────────────────────────

export async function setReferral(email: string, referralCode: string) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  await prisma.verificationCode.upsert({
    where: { key: `referral:${email}` },
    update: { value: referralCode, expiresAt },
    create: { key: `referral:${email}`, value: referralCode, expiresAt },
  });
}

export async function getReferral(email: string): Promise<string | null> {
  const entry = await prisma.verificationCode.findUnique({
    where: { key: `referral:${email}` },
  });
  if (!entry) return null;
  await prisma.verificationCode.delete({ where: { key: `referral:${email}` } });
  return entry.value;
}
