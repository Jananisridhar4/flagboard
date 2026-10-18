import { prisma } from "@/lib/prisma";

// Prisma Json column-ku Date direct-a podamudiyadhu, adhanaala plain JSON-a maathurom
const toJson = (value: unknown) => JSON.parse(JSON.stringify(value));

export async function writeAuditLog(
  flagId: string,
  action: string,
  oldValue: unknown,
  newValue: unknown
) {
  await prisma.auditLog.create({
    data: {
      flagId,
      action,
      oldValue: oldValue == null ? undefined : toJson(oldValue),
      newValue: newValue == null ? undefined : toJson(newValue),
    },
  });
}