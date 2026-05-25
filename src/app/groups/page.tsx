"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  inviteCode: string;
  owner: { id: string; name: string };
  _count: { members: number };
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/groups");
    if (res.ok) setGroups(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMsg("");
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setMsg(data.error); return; }
    router.push(`/groups/${data.id}`);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true);
    setMsg("");
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: joinCode }),
    });
    const data = await res.json();
    setJoining(false);
    if (!res.ok) { setMsg(data.error); return; }
    router.push(`/groups/${data.groupId}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">Grupy</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Utwórz grupę */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Utwórz nową grupę</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Nazwa grupy"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-60 rounded-lg py-2 text-sm font-medium transition-colors"
            >
              {creating ? "Tworzenie…" : "Utwórz grupę"}
            </button>
          </form>
        </div>

        {/* Dołącz do grupy */}
        <div className="bg-gray-900 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Dołącz do grupy</h2>
          <form onSubmit={handleJoin} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Kod zaproszenia"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              required
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm uppercase"
            />
            <button
              type="submit"
              disabled={joining}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-lg py-2 text-sm font-medium transition-colors"
            >
              {joining ? "Dołączanie…" : "Dołącz"}
            </button>
          </form>
        </div>
      </div>

      {msg && <p className="text-red-400 text-sm mb-4 text-center">{msg}</p>}

      {/* Lista grup */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Twoje grupy</h2>
      {loading ? (
        <p className="text-gray-500 text-sm">Ładowanie…</p>
      ) : groups.length === 0 ? (
        <p className="text-gray-500 text-sm">Nie należysz jeszcze do żadnej grupy.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              className="bg-gray-900 hover:bg-gray-800 rounded-xl px-5 py-4 flex items-center justify-between transition-colors"
            >
              <div>
                <div className="font-semibold text-white">{g.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">Założona przez: {g.owner.name} · {g._count.members} {g._count.members === 1 ? "osoba" : "osoby"}</div>
              </div>
              <span className="text-gray-600 text-lg">›</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
