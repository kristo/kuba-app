"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white tracking-tight">
          ⚽ Kuba Cup
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {session ? (
            <>
              <Link href="/matches" className="text-gray-300 hover:text-white transition-colors">
                Mecze
              </Link>
              <Link href="/groups" className="text-gray-300 hover:text-white transition-colors">
                Grupy
              </Link>
              <Link href="/leaderboard" className="text-gray-300 hover:text-white transition-colors">
                Ranking
              </Link>
              {session.user.isAdmin && (
                <Link href="/admin" className="text-amber-400 hover:text-amber-300 transition-colors">
                  Admin
                </Link>
              )}
              <span className="text-gray-500">|</span>
              <span className="text-gray-400">{session.user.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Wyloguj
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                Zaloguj się
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
