"use client";
import { useState, useEffect } from "react";

interface Match {
  id: string;
  matchNumber: number;
  homeTeam: { name: string; flagEmoji: string | null } | null;
  awayTeam: { name: string; flagEmoji: string | null } | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  kickoff: string;
}

interface InviteCode {
  id: string;
  code: string;
  usedBy: string | null;
  usedAt: string | null;
}

export default function AdminPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string>("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [resultMsg, setResultMsg] = useState("");
  const [codeMsg, setCodeMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/matches").then((r) => r.json()).then(setMatches);
    fetch("/api/invite").then((r) => r.json()).then(setCodes);
  }, []);

  async function submitResult(e: React.FormEvent) {
    e.preventDefault();
    setResultMsg("");
    const res = await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: selectedMatch, homeScore, awayScore }),
    });
    const data = await res.json();
    if (!res.ok) {
      setResultMsg(data.error ?? "Błąd.");
    } else {
      setResultMsg("Wynik zapisany!");
      const match = matches.find((m) => m.id === selectedMatch);
      setMatches((prev) =>
        prev.map((m) =>
          m.id === selectedMatch ? { ...m, homeScore, awayScore, status: "FINISHED" } : m
        )
      );
    }
  }

  async function generateCodes() {
    setCodeMsg("");
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: 5 }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCodeMsg("Błąd generowania kodów.");
    } else {
      setCodeMsg(`Wygenerowano: ${data.codes.join(", ")}`);
      fetch("/api/invite").then((r) => r.json()).then(setCodes);
    }
  }

  const upcomingMatches = matches.filter((m) => m.status !== "FINISHED");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Panel Administratora</h1>

      {/* Enter Result */}
      <section className="bg-gray-900 rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Wpisz wynik meczu</h2>
        <form onSubmit={submitResult} className="flex flex-col gap-4">
          <select
            value={selectedMatch}
            onChange={(e) => setSelectedMatch(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
          >
            <option value="">-- Wybierz mecz --</option>
            {upcomingMatches.map((m) => (
              <option key={m.id} value={m.id}>
                #{m.matchNumber} {m.homeTeam?.name ?? "TBD"} vs {m.awayTeam?.name ?? "TBD"}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-4">
            <input
              type="number"
              min={0}
              max={20}
              value={homeScore}
              onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
              className="w-20 text-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
            <span className="text-gray-500">–</span>
            <input
              type="number"
              min={0}
              max={20}
              value={awayScore}
              onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
              className="w-20 text-center bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
          {resultMsg && <p className={`text-sm ${resultMsg.includes("Błąd") ? "text-red-400" : "text-green-400"}`}>{resultMsg}</p>}
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-500 rounded-lg py-2.5 font-medium transition-colors"
          >
            Zapisz wynik
          </button>
        </form>
      </section>

      {/* Invite Codes */}
      <section className="bg-gray-900 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Kody zaproszeniowe</h2>
          <button
            onClick={generateCodes}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
          >
            Generuj 5 kodów
          </button>
        </div>
        {codeMsg && <p className="text-sm text-green-400 mb-3">{codeMsg}</p>}
        <div className="grid gap-2 max-h-80 overflow-y-auto">
          {codes.map((c) => (
            <div key={c.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2">
              <code className="font-mono text-white">{c.code}</code>
              {c.usedBy ? (
                <span className="text-xs text-gray-500">wykorzystany</span>
              ) : (
                <span className="text-xs text-green-400">wolny</span>
              )}
            </div>
          ))}
          {codes.length === 0 && <p className="text-gray-500 text-sm">Brak kodów. Wygeneruj pierwsze.</p>}
        </div>
      </section>
    </div>
  );
}
