"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Nieprawidłowy e-mail lub hasło.");
    } else {
      router.push("/matches");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6">Zaloguj się</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-60 rounded-lg py-2.5 font-medium transition-colors"
          >
            {loading ? "Logowanie…" : "Zaloguj się"}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Masz kod zaproszenia?{" "}
          <Link href="/register" className="text-green-400 hover:underline">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  );
}
