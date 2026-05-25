import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// POST /api/groups/join — dołącza do grupy kodem zaproszenia
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteCode } = await req.json();
  if (!inviteCode?.trim()) return NextResponse.json({ error: "Podaj kod zaproszenia." }, { status: 400 });

  const group = await prisma.group.findUnique({
    where: { inviteCode: inviteCode.trim().toUpperCase() },
  });
  if (!group) return NextResponse.json({ error: "Nieprawidłowy kod zaproszenia." }, { status: 404 });

  const existing = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId: group.id } },
  });
  if (existing) return NextResponse.json({ error: "Jesteś już w tej grupie." }, { status: 409 });

  await prisma.groupMembership.create({
    data: { userId: session.user.id, groupId: group.id },
  });

  return NextResponse.json({ groupId: group.id });
}
