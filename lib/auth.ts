// lib/auth.ts
export function getUserIdOrDev(): string {
  const v = process.env.DEV_OWNER_ID;
  if (!v) throw new Error("DEV_OWNER_ID manquant dans .env.local");
  return v;
}
