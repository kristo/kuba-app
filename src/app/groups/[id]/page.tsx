"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Member {
  id: string;
  name: string;
  points: number;
  exact: number;
  correct: number;
}

interface GroupDetail {
  id: string;
  name: string;
  inviteCode: string;
  owner: { id: string; name: string };
  leaderboard: Member[];
}

export default function GroupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${id}`);
    if (res.ok) setGroup(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function copyCode() {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!confirm("Na pewno usunąć grupę?")) return;
    setDeleting(true);
    await fetch(`/api/groups/${id}`, { method: "DELETE" });
    router.push("/groups");
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8 text-gray-500">Ładowanie…</div>;
  if (!group) return <div className="max-w-2xl mx-auto px-4 py-8 text-red-400">Nie znaleziono grupy.</div>;

  const isOwner = session?.user.id === group.owner.id;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/groups"
        className="inline-flex items-center gap-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-4 py-2 mb-6 transition-colors"
      >
        ← Wróć do grup
      </Link>

      <div className="bg-gray-900 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">{group.name}</h1>
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              Usuń grupę
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-4">Założona przez: {group.owner.name}</p>

        <div className="bg-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Kod zaproszenia</div>
            <div className="font-mono text-lg font-bold text-white tracking-widest">{group.inviteCode}</div>
          </div>
          <button
            onClick={copyCode}
            className="text-sm bg-gray-700 hover:bg-gray-600 rounded-lg px-3 py-1.5 transition-colors text-white"
          >
            {copied ? "Skopiowano!" : "Kopiuj"}
          </button>
        </div>
      </div>

      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Ranking grupy ({group.leaderboard.length} {group.leaderboard.length === 1 ? "osoba" : "osoby"})
      </h2>
      <div className="flex flex-col gap-2">
        {group.leaderboard.map((member, i) => (
          <div
            key={member.id}
            className={`bg-gray-900 rounded-xl px-5 py-3 flex items-center gap-4 ${member.id === session?.user.id ? "ring-1 ring-green-600" : ""}`}
          >
            <span className={`w-6 text-center font-bold text-sm ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-gray-600"}`}>
              {i + 1}
            </span>
            <span className="flex-1 font-medium text-white">{member.name}</span>
            <span className="text-xs text-gray-500">
              <span className="text-green-400">{member.exact}×5pkt</span>
              {" · "}
              <span className="text-blue-400">{member.correct}×2pkt</span>
            </span>
            <span className="font-bold text-white w-14 text-right">{member.points} pkt</span>
          </div>
        ))}
      </div>
    </div>
  );
}
