import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROUND_OF_32_PAIRS: Array<{ matchNumber: number; home: string; away: string }> = [
  { matchNumber: 73, home: "RSA", away: "CAN" },
  { matchNumber: 74, home: "BRA", away: "JPN" },
  { matchNumber: 75, home: "GER", away: "PAR" },
  { matchNumber: 76, home: "NED", away: "MAR" },
  { matchNumber: 77, home: "CIV", away: "NOR" },
  { matchNumber: 78, home: "FRA", away: "SWE" },
  { matchNumber: 79, home: "MEX", away: "ECU" },
  { matchNumber: 80, home: "ENG", away: "COD" },
  { matchNumber: 81, home: "BEL", away: "SEN" },
  { matchNumber: 82, home: "USA", away: "BIH" },
  { matchNumber: 83, home: "ESP", away: "AUT" },
  { matchNumber: 84, home: "POR", away: "CRO" },
  { matchNumber: 85, home: "SUI", away: "ALG" },
  { matchNumber: 86, home: "AUS", away: "EGY" },
  { matchNumber: 87, home: "ARG", away: "CPV" },
  { matchNumber: 88, home: "COL", away: "GHA" },
];

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

export async function POST() {
  const session = await auth();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teams = await prisma.team.findMany({
    select: { id: true, code: true },
  });
  const teamIdByCode = new Map(teams.map((t) => [t.code, t.id]));

  await prisma.$transaction(
    ROUND_OF_32_PAIRS.map((pair) => {
      const homeTeamId = teamIdByCode.get(pair.home);
      const awayTeamId = teamIdByCode.get(pair.away);

      if (!homeTeamId || !awayTeamId) {
        throw new Error(`Brak drużyny dla kodów: ${pair.home}/${pair.away}`);
      }

      return prisma.match.update({
        where: { matchNumber: pair.matchNumber },
        data: { homeTeamId, awayTeamId },
      });
    })
  );

  const matches = await prisma.match.findMany({
    where: { matchNumber: { gte: 73, lte: 88 } },
    include: { homeTeam: true, awayTeam: true },
    orderBy: { matchNumber: "asc" },
  });

  return NextResponse.json({ updated: matches.length, matches });
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
