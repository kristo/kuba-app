import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MatchStage, MatchStatus } from "@prisma/client";

type MatchWithTeams = {
  id: string;
  homeTeam: { name: string; flagEmoji: string | null } | null;
  awayTeam: { name: string; flagEmoji: string | null } | null;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  stage: MatchStage;
  matchNumber: number;
  kickoff: Date;
};

const SLOT_HEIGHT = 80;
const CARD_HEIGHT = 62;
const CARD_WIDTH = 158;
const CONN_W = 24;
const TOTAL_HEIGHT = 16 * SLOT_HEIGHT; // 1280px

const KNOCKOUT_STAGES: MatchStage[] = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "FINAL",
];

const STAGE_LABEL: Record<string, string> = {
  ROUND_OF_32: "1/32",
  ROUND_OF_16: "1/16",
  QUARTER_FINAL: "Ćwierćfinały",
  SEMI_FINAL: "Półfinały",
  FINAL: "Finał",
};

const SLOTS_PER_MATCH: Record<string, number> = {
  ROUND_OF_32: 1,
  ROUND_OF_16: 2,
  QUARTER_FINAL: 4,
  SEMI_FINAL: 8,
  FINAL: 16,
};

function matchCenter(matchIndex: number, slotsPerMatch: number): number {
  return (matchIndex + 0.5) * slotsPerMatch * SLOT_HEIGHT;
}

function MatchCard({ match }: { match: MatchWithTeams }) {
  const isFinished = match.status === "FINISHED";
  const homeWins = isFinished && (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWins = isFinished && (match.awayScore ?? 0) > (match.homeScore ?? 0);

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-600 transition-colors"
      style={{ width: CARD_WIDTH }}
    >
      <div className={`flex items-center gap-1 px-2 py-1.5 ${homeWins ? "bg-green-900/20" : ""}`}>
        <span className="text-xs shrink-0 w-5 text-center leading-none">
          {match.homeTeam?.flagEmoji ?? "🏴"}
        </span>
        <span className={`text-xs font-medium truncate flex-1 ${homeWins ? "text-white" : "text-gray-400"}`}>
          {match.homeTeam?.name ?? "TBD"}
        </span>
        {isFinished && (
          <span className={`text-xs font-bold shrink-0 ml-1 ${homeWins ? "text-white" : "text-gray-500"}`}>
            {match.homeScore}
          </span>
        )}
      </div>
      <div className="border-t border-gray-800" />
      <div className={`flex items-center gap-1 px-2 py-1.5 ${awayWins ? "bg-green-900/20" : ""}`}>
        <span className="text-xs shrink-0 w-5 text-center leading-none">
          {match.awayTeam?.flagEmoji ?? "🏴"}
        </span>
        <span className={`text-xs font-medium truncate flex-1 ${awayWins ? "text-white" : "text-gray-400"}`}>
          {match.awayTeam?.name ?? "TBD"}
        </span>
        {isFinished && (
          <span className={`text-xs font-bold shrink-0 ml-1 ${awayWins ? "text-white" : "text-gray-500"}`}>
            {match.awayScore}
          </span>
        )}
      </div>
    </Link>
  );
}

function BracketConnector({
  leftSpm,
  rightSpm,
  numRight,
}: {
  leftSpm: number;
  rightSpm: number;
  numRight: number;
}) {
  const xMid = CONN_W / 2;
  const paths: string[] = [];

  for (let i = 0; i < numRight; i++) {
    const y1 = matchCenter(i * 2, leftSpm);
    const y2 = matchCenter(i * 2 + 1, leftSpm);
    const yr = matchCenter(i, rightSpm);
    paths.push(`M 0 ${y1} H ${xMid}`);
    paths.push(`M 0 ${y2} H ${xMid}`);
    paths.push(`M ${xMid} ${y1} V ${y2}`);
    paths.push(`M ${xMid} ${yr} H ${CONN_W}`);
  }

  return (
    <svg
      width={CONN_W}
      height={TOTAL_HEIGHT}
      className="shrink-0"
      style={{ minWidth: CONN_W }}
    >
      {paths.map((d, i) => (
        <path key={i} d={d} stroke="#374151" strokeWidth="1" fill="none" />
      ))}
    </svg>
  );
}

export default async function BracketPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const allStages: MatchStage[] = [...KNOCKOUT_STAGES, "THIRD_PLACE"];
  const matches = await prisma.match.findMany({
    where: { stage: { in: allStages } },
    include: { homeTeam: true, awayTeam: true },
    orderBy: [{ matchNumber: "asc" }],
  });

  const byStage = new Map<MatchStage, MatchWithTeams[]>();
  for (const stage of allStages) {
    byStage.set(stage, matches.filter((m) => m.stage === stage) as MatchWithTeams[]);
  }

  const thirdPlace = byStage.get("THIRD_PLACE") ?? [];

  return (
    <div className="px-4 py-8">
      <div className="max-w-5xl mx-auto mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          🏆 Drabinka turniejowa
        </h1>
        <p className="text-gray-400 mt-1 text-sm">FIFA World Cup 2026 – faza pucharowa</p>
      </div>

      <div className="overflow-x-auto pb-6">
        {/* Column headers */}
        <div className="flex items-start w-fit mb-3">
          {KNOCKOUT_STAGES.map((stage, idx) => (
            <div key={stage} className="flex items-start shrink-0">
              <div
                className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center"
                style={{ width: CARD_WIDTH }}
              >
                {STAGE_LABEL[stage]}
              </div>
              {idx < KNOCKOUT_STAGES.length - 1 && (
                <div style={{ width: CONN_W }} />
              )}
            </div>
          ))}
        </div>

        {/* Bracket grid */}
        <div className="flex items-start w-fit">
          {KNOCKOUT_STAGES.map((stage, idx) => {
            const stageMatches = byStage.get(stage) ?? [];
            const spm = SLOTS_PER_MATCH[stage];
            const nextStage = KNOCKOUT_STAGES[idx + 1];
            const nextSpm = nextStage ? SLOTS_PER_MATCH[nextStage] : null;
            const nextCount = nextStage ? (byStage.get(nextStage)?.length ?? 0) : 0;

            return (
              <div key={stage} className="flex items-start shrink-0">
                {/* Match column */}
                <div
                  className="relative shrink-0"
                  style={{ height: TOTAL_HEIGHT, width: CARD_WIDTH }}
                >
                  {stageMatches.map((match, i) => {
                    const top = matchCenter(i, spm) - CARD_HEIGHT / 2;
                    return (
                      <div
                        key={match.id}
                        className="absolute"
                        style={{ top, left: 0, width: CARD_WIDTH }}
                      >
                        <MatchCard match={match} />
                      </div>
                    );
                  })}
                </div>

                {/* Bracket connector to next round */}
                {nextSpm && nextCount > 0 && (
                  <BracketConnector
                    leftSpm={spm}
                    rightSpm={nextSpm}
                    numRight={nextCount}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Third place */}
      {thirdPlace.length > 0 && (
        <div className="max-w-xs mx-auto mt-8 text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Mecz o 3. miejsce
          </p>
          <MatchCard match={thirdPlace[0]} />
        </div>
      )}
    </div>
  );
}
