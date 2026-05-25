import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalcMatchPredictions } from "@/app/api/predictions/route";

// POST /api/results — admin enters final score for a match
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { matchId, homeScore, awayScore } = await req.json();

  if (typeof homeScore !== "number" || typeof awayScore !== "number" || homeScore < 0 || awayScore < 0) {
    return NextResponse.json({ error: "Nieprawidłowy wynik." }, { status: 400 });
  }

  const match = await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, status: "FINISHED" },
  });

  await recalcMatchPredictions(matchId);

  return NextResponse.json(match);
}
