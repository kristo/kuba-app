import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

// GET /api/groups — zwraca grupy zalogowanego użytkownika
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.groupMembership.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json(memberships.map((m) => m.group));
}

// POST /api/groups — tworzy nową grupę
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nazwa grupy jest wymagana." }, { status: 400 });

  const inviteCode = randomBytes(4).toString("hex").toUpperCase();

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      inviteCode,
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id },
      },
    },
  });

  return NextResponse.json(group, { status: 201 });
}
