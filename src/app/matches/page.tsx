import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MatchStage } from "@prisma/client";

const STAGE_LABELS: Record<MatchStage, string> = {
  GROUP: "Faza grupowa",
  ROUND_OF_32: "1/32 finału",
  ROUND_OF_16: "1/16 finału",
  QUARTER_FINAL: "Ćwierćfinał",
  SEMI_FINAL: "Półfinał",
  THIRD_PLACE: "Mecz o 3. miejsce",
  FINAL: "Finał",
};

const STAGE_ORDER: MatchStage[] = [
  "GROUP",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "THIRD_PLACE",
  "FINAL",
];

export default async function MatchesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ matchNumber: "asc" }],
  });

  const myPredictions = await prisma.prediction.findMany({
    where: { userId: session.user.id },
    select: { matchId: true, homeScore: true, awayScore: true, points: true },
  });
  const predMap = new Map(myPredictions.map((p) => [p.matchId, p]));

  const grouped = STAGE_ORDER.reduce((acc, stage) => {
    const stageMatches = matches.filter((m) => m.stage === stage);
    if (stageMatches.length) acc.push({ stage, matches: stageMatches });
    return acc;
  }, [] as { stage: MatchStage; matches: typeof matches }[]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Mecze</h1>
      {grouped.map(({ stage, matches: stageMatches }) => (
        <section key={stage} className="mb-10">
          <h2 className="text-lg font-semibold text-gray-300 mb-3 uppercase tracking-wider">
            {STAGE_LABELS[stage]}
          </h2>
          <div className="grid gap-2">
            {stageMatches.map((match) => {
              const pred = predMap.get(match.id);
              const canType = match.status === "UPCOMING" && new Date() < match.kickoff;
              return (
                <Link
                  key={match.id}
                  href={`/matches/${match.id}`}
                  className="flex items-center justify-between bg-gray-900 hover:bg-gray-800 rounded-xl px-5 py-4 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-gray-500 w-6 shrink-0">#{match.matchNumber}</span>
                    <div className="flex items-center gap-2 font-medium text-white">
                      <span>{match.homeTeam?.flagEmoji ?? "🏴"}</span>
                      <span className="truncate">{match.homeTeam?.name ?? "TBD"}</span>
                      <span className="text-gray-500 px-1">vs</span>
                      <span className="truncate">{match.awayTeam?.name ?? "TBD"}</span>
                      <span>{match.awayTeam?.flagEmoji ?? "🏴"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    {match.status === "FINISHED" ? (
                      <span className="font-bold text-white">
                        {match.homeScore}–{match.awayScore}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {new Date(match.kickoff).toLocaleDateString("pl-PL", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                    {pred ? (
                      <span className={`text-sm px-2.5 py-1 rounded-full ${
                        match.status === "FINISHED"
                          ? pred.points === 5
                            ? "bg-amber-500/20 text-amber-400"
                            : pred.points === 2
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {pred.homeScore}–{pred.awayScore}
                        {match.status === "FINISHED" && ` (${pred.points} pkt)`}
                      </span>
                    ) : canType ? (
                      <span className="text-sm text-gray-600 italic">brak typu</span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
