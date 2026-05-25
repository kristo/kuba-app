"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  matchId: string;
  initialHome?: number;
  initialAway?: number;
  canType: boolean;
}

export default function PredictionForm({ matchId, initialHome, initialAway, canType }: Props) {
  const router = useRouter();
  const [home, setHome] = useState(initialHome ?? 0);
  const [away, setAway] = useState(initialAway ?? 0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, homeScore: home, awayScore: away }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMsg(data.error ?? "Błąd.");
    } else {
      router.push("/matches");
    }
  }

  if (!canType) return null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-4">
        <input
          type="number"
          min={0}
          max={20}
          value={home}
          onChange={(e) => setHome(parseInt(e.target.value) || 0)}
          className="w-20 text-center text-2xl font-bold bg-gray-800 border border-gray-700 rounded-lg py-3 text-white focus:outline-none focus:border-green-500"
        />
        <span className="text-gray-500 text-xl">–</span>
        <input
          type="number"
          min={0}
          max={20}
          value={away}
          onChange={(e) => setAway(parseInt(e.target.value) || 0)}
          className="w-20 text-center text-2xl font-bold bg-gray-800 border border-gray-700 rounded-lg py-3 text-white focus:outline-none focus:border-green-500"
        />
      </div>
      {msg && <p className={`text-sm text-center ${msg === "Zapisano!" ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 rounded-lg py-2.5 font-medium transition-colors"
      >
        {saving ? "Zapisywanie…" : initialHome !== undefined ? "Aktualizuj typ" : "Zapisz typ"}
      </button>
      <button
        type="button"
        onClick={() => router.push("/matches")}
        className="w-full bg-gray-700 hover:bg-gray-600 rounded-lg py-2.5 font-medium transition-colors"
      >
        Wróć do meczów
      </button>
    </form>
  );
}
