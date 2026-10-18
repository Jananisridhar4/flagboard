import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/flags/:id/history  -> audit log, latest first
export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;

  const logs = await prisma.auditLog.findMany({
    where: { flagId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(logs);
}