import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const TTL_SECONDS = 60;

export type CachedFlag = {
  key: string;
  enabled: boolean;
  rolloutPercent: number;
};

const cacheKey = (key: string, env: string) => `flag:${env}:${key}`;

export async function getFlagCached(
  key: string,
  env: string
): Promise<{ flag: CachedFlag | null; source: "cache" | "db" }> {
  const ck = cacheKey(key, env);

  // 1. Redis-la mudhalla paarkurom. Redis down aanaalum app break aagakoodadhu.
  try {
    const hit = await redis.get(ck);
    if (hit) return { flag: JSON.parse(hit), source: "cache" };
  } catch {}

  // 2. Cache miss -> DB
  const flag = await prisma.flag.findUnique({
    where: { key_environment: { key, environment: env } },
    select: { key: true, enabled: true, rolloutPercent: true },
  });

  // 3. Next time-ku Redis-la save
  if (flag) {
    try {
      await redis.set(ck, JSON.stringify(flag), "EX", TTL_SECONDS);
    } catch {}
  }

  return { flag, source: "db" };
}

export async function invalidateFlag(key: string, env: string) {
  try {
    await redis.del(cacheKey(key, env));
  } catch {}
}