import { NextResponse } from "next/server";
import { getFlagCached } from "@/lib/flag-cache";
import { isEnabledForUser } from "@/lib/rollout";

type Ctx = { params: Promise<{ key: string }> };

// GET /api/evaluate/new-checkout?userId=123&env=dev
export async function GET(request: Request, { params }: Ctx) {
  const { key } = await params;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const env = url.searchParams.get("env") ?? "dev";

  const { flag, source } = await getFlagCached(key, env);

  // Flag illana error throw pannaama safe-a "false" return (fail-safe)
  if (!flag) {
    return NextResponse.json({ enabled: false, reason: "flag_not_found" });
  }

  return NextResponse.json({
    enabled: isEnabledForUser(flag, userId),
    source,
  });
}