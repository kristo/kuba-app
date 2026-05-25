import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/groups/[id] — szczegóły grupy + ranking członków
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true } },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              predictions: {
                select: { points: true },
              },
            },
          },
        },
      },
    },
  });

  if (!group) return NextResponse.json({ error: "Nie znaleziono grupy." }, { status: 404 });

  // Check membership
  const isMember = group.members.some((m) => m.userId === session.user.id);
  if (!isMember) return NextResponse.json({ error: "Brak dostępu." }, { status: 403 });

  const leaderboard = group.members
    .map((m) => ({
      id: m.user.id,
      name: m.user.name,
      points: m.user.predictions.reduce((sum, p) => sum + (p.points ?? 0), 0),
      exact: m.user.predictions.filter((p) => p.points === 5).length,
      correct: m.user.predictions.filter((p) => p.points === 2).length,
    }))
    .sort((a, b) => b.points - a.points || b.exact - a.exact);

  return NextResponse.json({
    id: group.id,
    name: group.name,
    inviteCode: group.inviteCode,
    owner: group.owner,
    leaderboard,
  });
}

// DELETE /api/groups/[id] — usuwa grupę (tylko właściciel)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const group = await prisma.group.findUnique({ where: { id } });
  if (!group) return NextResponse.json({ error: "Nie znaleziono grupy." }, { status: 404 });
  if (group.ownerId !== session.user.id) return NextResponse.json({ error: "Brak uprawnień." }, { status: 403 });

  await prisma.groupMembership.deleteMany({ where: { groupId: id } });
  await prisma.group.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
