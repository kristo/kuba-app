import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/matches");

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 text-center px-4">
      <div className="text-6xl">⚽</div>
      <h1 className="text-4xl font-bold text-white">Kuba Cup</h1>
      <p className="text-gray-400 max-w-md">
        Rywalizuj ze znajomymi typując wyniki meczów Mistrzostw Świata 2026.
        Zbieraj punkty i wspinaj się w rankingu!
      </p>
      <div className="flex gap-3">
        <Link
          href="/register"
          className="px-6 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg font-medium transition-colors"
        >
          Dołącz z kodem
        </Link>
        <Link
          href="/login"
          className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
        >
          Zaloguj się
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-6 mt-8 text-center">
        <div className="bg-gray-900 rounded-xl p-5">
          <div className="text-3xl font-bold text-green-400">2 pkt</div>
          <div className="text-sm text-gray-400 mt-1">trafiony wynik</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <div className="text-3xl font-bold text-amber-400">+3 pkt</div>
          <div className="text-sm text-gray-400 mt-1">dokładny wynik</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <div className="text-3xl font-bold text-blue-400">104</div>
          <div className="text-sm text-gray-400 mt-1">mecze do typowania</div>
        </div>
      </div>
    </div>
  );
}
