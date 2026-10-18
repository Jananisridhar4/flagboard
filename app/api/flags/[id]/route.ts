import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateFlagSchema } from "@/lib/validation";
import { writeAuditLog } from "@/lib/audit";
import { invalidateFlag } from "@/lib/flag-cache";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/flags/:id  -> toggle, rollout %, name maathalam
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = updateFlagSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  const existing = await prisma.flag.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  const updated = await prisma.flag.update({
    where: { id },
    data: parsed.data,
  });

  await writeAuditLog(id, "UPDATE", existing, updated);
  await invalidateFlag(existing.key, existing.environment);

  return NextResponse.json(updated);
}

// DELETE /api/flags/:id
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;

  const existing = await prisma.flag.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  await prisma.flag.delete({ where: { id } });
  await invalidateFlag(existing.key, existing.environment);

  return NextResponse.json({ deleted: true });
}