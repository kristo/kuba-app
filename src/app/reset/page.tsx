"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResetPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) return setError("Hasło musi mieć minimum 6 znaków.");
    if (password !== confirm) return setError("Hasła się nie zgadzają.");
    setLoading(true);
    const res = await fetch("/api/auth/reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Coś poszło nie tak.");
    } else {
      router.push("/login?reset=1");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6">Ustaw nowe hasło</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Nowe hasło</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Powtórz hasło</label>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              name="confirm"
              type="password"
              required
              minLength={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 rounded-lg py-2.5 font-medium transition-colors"
          >
            {loading ? "Przetwarzanie…" : "Ustaw nowe hasło"}
          </button>
        </form>
      </div>
    </div>
  );
}
