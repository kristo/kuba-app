import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teams = await prisma.team.findMany({
    select: { id: true, name: true, code: true },
    orderBy: [{ group: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(teams);
}
