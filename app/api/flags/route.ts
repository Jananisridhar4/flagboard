import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createFlagSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";

// GET /api/flags?env=dev  -> flags list
export async function GET(request: Request) {
  const env = new URL(request.url).searchParams.get("env");

  const flags = await prisma.flag.findMany({
    where: env ? { environment: env } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(flags);
}

// POST /api/flags  -> puthu flag create
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createFlagSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.flag.findUnique({
    where: {
      key_environment: {
        key: parsed.data.key,
        environment: parsed.data.environment,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Flag already exists in this environment" },
      { status: 409 }
    );
  }

  const flag = await prisma.flag.create({ data: parsed.data });
  await writeAuditLog(flag.id, "CREATE", null, flag);

  return NextResponse.json(flag, { status: 201 });
}