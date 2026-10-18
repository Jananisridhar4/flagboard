import { createHash } from "crypto";

// flagKey + userId -> 0 to 99 number. Same user-ku eppavum same number varum.
export function getBucket(flagKey: string, userId: string): number {
  const hash = createHash("sha256")
    .update(`${flagKey}:${userId}`)
    .digest("hex");
  return parseInt(hash.slice(0, 8), 16) % 100;
}

export function isEnabledForUser(
  flag: { key: string; enabled: boolean; rolloutPercent: number },
  userId?: string | null
): boolean {
  if (!flag.enabled) return false;
  if (flag.rolloutPercent >= 100) return true;
  if (flag.rolloutPercent <= 0) return false;
  if (!userId) return false;

  return getBucket(flag.key, userId) < flag.rolloutPercent;
}