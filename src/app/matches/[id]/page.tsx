import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PredictionForm from "@/components/PredictionForm";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const match = await prisma.match.findUnique({
    where: { id },
    include: { homeTeam: true, awayTeam: true },
  });
  if (!match) notFound();

  const myPrediction = await prisma.prediction.findUnique({
    where: { userId_matchId: { userId: session.user.id, matchId: id } },
  });

  // All predictions for this match (visible after match finishes)
  const allPredictions =
    match.status === "FINISHED"
      ? await prisma.prediction.findMany({
          where: { matchId: id },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { points: "desc" },
        })
      : [];

  const teamsKnown = match.homeTeamId !== null && match.awayTeamId !== null;
  const canType = match.status === "UPCOMING" && new Date() < match.kickoff && teamsKnown;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <a
        href="/matches"
        className="inline-flex items-center gap-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-4 py-2 mb-6 transition-colors"
      >
        ← Wróć do meczów
      </a>
      <div className="bg-gray-900 rounded-2xl p-8 mb-6">
        <div className="text-sm text-gray-500 mb-4 uppercase tracking-wider">{match.groupLabel ?? match.stage}</div>
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-4xl mb-1">{match.homeTeam?.flagEmoji ?? "🏴"}</div>
            <div className="text-lg font-bold text-white">{match.homeTeam?.name ?? "TBD"}</div>
          </div>
          {match.status === "FINISHED" ? (
            <div className="text-4xl font-bold text-white px-4">
              {match.homeScore}–{match.awayScore}
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">vs</div>
              <div className="text-sm text-gray-600 mt-1">
                {new Date(match.kickoff).toLocaleDateString("pl-PL", {
                  weekday: "short",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          )}
          <div className="text-center">
            <div className="text-4xl mb-1">{match.awayTeam?.flagEmoji ?? "🏴"}</div>
            <div className="text-lg font-bold text-white">{match.awayTeam?.name ?? "TBD"}</div>
          </div>
        </div>

        {match.status === "UPCOMING" && (
          <div className="border-t border-gray-800 pt-6">
            <h2 className="text-sm text-gray-400 mb-4 text-center">
              {canType ? "Twój typ" : !teamsKnown ? "Czekamy na awans drużyn" : "Typowanie zamknięte"}
            </h2>
            {myPrediction && !canType ? (
              <p className="text-center text-white text-xl font-bold">
                {myPrediction.homeScore}–{myPrediction.awayScore}
              </p>
            ) : (
              <PredictionForm
                matchId={id}
                initialHome={myPrediction?.homeScore}
                initialAway={myPrediction?.awayScore}
                canType={canType}
              />
            )}
          </div>
        )}

        {match.status === "FINISHED" && myPrediction && (
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-sm text-gray-400 mb-1">Twój typ</p>
            <p className="text-2xl font-bold text-white mb-2">
              {myPrediction.homeScore}–{myPrediction.awayScore}
            </p>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              myPrediction.points === 5
                ? "bg-amber-500/20 text-amber-400"
                : myPrediction.points === 2
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}>
              {myPrediction.points} punktów
            </span>
          </div>
        )}
      </div>

      {allPredictions.length > 0 && (
        <div className="bg-gray-900 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Typy znajomych</h2>
          <div className="flex flex-col gap-2">
            {allPredictions.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <span className="text-gray-300">{p.user.name}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-white">{p.homeScore}–{p.awayScore}</span>
                  <span className={`text-sm font-medium w-12 text-right ${
                    p.points === 5 ? "text-amber-400" : p.points === 2 ? "text-green-400" : "text-red-400"
                  }`}>
                    {p.points} pkt
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
