import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4">Sempery</h1>
        <p className="text-xl text-zinc-400 mb-8">
          Digital Business Cards – Share your contact with a tap
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-blue-600 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-6 text-zinc-600 text-sm">
        © 2025 Sempery
      </footer>
    </div>
  );
}
