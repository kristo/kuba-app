import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      predictions: {
        select: { points: true },
      },
    },
  });

  const ranked = users
    .map((u) => {
      const typed = u.predictions.length;
      const scored = u.predictions.filter((p) => p.points !== null).length;
      const total = u.predictions.reduce((sum, p) => sum + (p.points ?? 0), 0);
      const exact = u.predictions.filter((p) => p.points === 5).length;
      const correct = u.predictions.filter((p) => p.points === 2).length;
      return { ...u, total, typed, scored, exact, correct };
    })
    .sort((a, b) => b.total - a.total || b.exact - a.exact);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Ranking</h1>
      <div className="bg-gray-900 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-800">
              <th className="px-5 py-3 text-left">#</th>
              <th className="px-5 py-3 text-left">Gracz</th>
              <th className="px-5 py-3 text-right">Pkt</th>
              <th className="px-5 py-3 text-right hidden sm:table-cell">Dokładne</th>
              <th className="px-5 py-3 text-right hidden sm:table-cell">Trafione</th>
              <th className="px-5 py-3 text-right hidden sm:table-cell">Typy</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((user, i) => (
              <tr
                key={user.id}
                className={`border-b border-gray-800 last:border-0 ${
                  user.id === session.user.id ? "bg-green-500/5" : ""
                }`}
              >
                <td className="px-5 py-4 text-gray-500 text-sm">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </td>
                <td className="px-5 py-4 font-medium text-white">
                  {user.name}
                  {user.id === session.user.id && (
                    <span className="ml-2 text-xs text-green-400">(Ty)</span>
                  )}
                </td>
                <td className="px-5 py-4 text-right font-bold text-white">{user.total}</td>
                <td className="px-5 py-4 text-right text-amber-400 hidden sm:table-cell">{user.exact}</td>
                <td className="px-5 py-4 text-right text-green-400 hidden sm:table-cell">{user.correct}</td>
                <td className="px-5 py-4 text-right text-gray-400 hidden sm:table-cell">{user.scored}/{user.typed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
