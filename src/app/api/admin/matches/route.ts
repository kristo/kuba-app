import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchNumber: "asc" },
  });

  return NextResponse.json(matches);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { matchId, homeTeamId, awayTeamId, kickoff } = await req.json();

  if (!matchId || typeof matchId !== "string") {
    return NextResponse.json({ error: "Brak matchId." }, { status: 400 });
  }

  if (typeof kickoff !== "string" || Number.isNaN(Date.parse(kickoff))) {
    return NextResponse.json({ error: "Nieprawidłowa data rozpoczęcia." }, { status: 400 });
  }

  const normalizedHomeTeamId = homeTeamId ?? null;
  const normalizedAwayTeamId = awayTeamId ?? null;

  if ((normalizedHomeTeamId && !normalizedAwayTeamId) || (!normalizedHomeTeamId && normalizedAwayTeamId)) {
    return NextResponse.json({ error: "Podaj obie drużyny albo żadnej." }, { status: 400 });
  }

  if (normalizedHomeTeamId && normalizedAwayTeamId && normalizedHomeTeamId === normalizedAwayTeamId) {
    return NextResponse.json({ error: "Drużyny muszą być różne." }, { status: 400 });
  }

  if (normalizedHomeTeamId && normalizedAwayTeamId) {
    const teamsCount = await prisma.team.count({
      where: { id: { in: [normalizedHomeTeamId, normalizedAwayTeamId] } },
    });
    if (teamsCount !== 2) {
      return NextResponse.json({ error: "Wybrano nieistniejącą drużynę." }, { status: 400 });
    }
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      homeTeamId: normalizedHomeTeamId,
      awayTeamId: normalizedAwayTeamId,
      kickoff: new Date(kickoff),
    },
    include: { homeTeam: true, awayTeam: true },
  });

  return NextResponse.json(updated);
}
