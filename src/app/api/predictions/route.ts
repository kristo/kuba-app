import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calcPoints } from "@/lib/scoring";

// POST /api/predictions — submit or update a prediction
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matchId, homeScore, awayScore } = await req.json();

  if (typeof homeScore !== "number" || typeof awayScore !== "number" || homeScore < 0 || awayScore < 0) {
    return NextResponse.json({ error: "Nieprawidłowy wynik." }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return NextResponse.json({ error: "Mecz nie istnieje." }, { status: 404 });

  if (match.status !== "UPCOMING") {
    return NextResponse.json({ error: "Typowanie jest już zamknięte dla tego meczu." }, { status: 400 });
  }

  if (new Date() >= match.kickoff) {
    return NextResponse.json({ error: "Mecz już się rozpoczął." }, { status: 400 });
  }

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    create: { userId: session.user.id, matchId, homeScore, awayScore },
    update: { homeScore, awayScore, submittedAt: new Date() },
  });

  return NextResponse.json(prediction);
}

// GET /api/predictions?matchId=... — get my prediction for a match
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const matchId = req.nextUrl.searchParams.get("matchId");
  if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });

  const prediction = await prisma.prediction.findUnique({
    where: { userId_matchId: { userId: session.user.id, matchId } },
  });

  return NextResponse.json(prediction ?? null);
}

// Internal helper used by results API — not exported as HTTP
export async function recalcMatchPredictions(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.homeScore === null || match.awayScore === null) return;

  const predictions = await prisma.prediction.findMany({ where: { matchId } });

  await Promise.all(
    predictions.map((p) =>
      prisma.prediction.update({
        where: { id: p.id },
        data: {
          points: calcPoints(p.homeScore, p.awayScore, match.homeScore!, match.awayScore!),
        },
      })
    )
  );
}
