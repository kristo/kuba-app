"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        inviteCode: form.get("inviteCode"),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Coś poszło nie tak.");
    } else {
      router.push("/login?registered=1");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6">Rejestracja</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Kod zaproszenia</label>
            <input
              name="inviteCode"
              type="text"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Imię / Pseudonim</label>
            <input
              name="name"
              type="text"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">E-mail</label>
            <input
              name="email"
              type="email"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Hasło</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Wskazówka do hasła (opcjonalnie)</label>
            <input
              name="passwordHint"
              type="text"
              maxLength={100}
              placeholder="Np. ostatnie 3 znaki"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 rounded-lg py-2.5 font-medium transition-colors"
          >
            {loading ? "Rejestracja…" : "Zarejestruj się"}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Masz już konto?{" "}
          <Link href="/login" className="text-green-400 hover:underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
