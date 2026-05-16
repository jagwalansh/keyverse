import { createFileRoute, Link } from "@tanstack/react-router";
import { LogIn, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AccountModal } from "@/components/ui/account-modal";
import { AuthModal } from "@/components/ui/auth-modal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { searchTracks, type TrackSearchResult } from "@/lib/lrc";
import { useModal } from "@/lib/modal-context";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { setModalOpen } = useModal();
  const { user, profile, loading: authLoading } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<TrackSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await searchTracks(q);
      setResults(r);
      if (!r.length) setErr("No songs with previews found.");
    } catch {
      setErr("Search failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <nav className="border-b bg-background/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="font-mono text-xl font-medium tracking-tight">
            lyric<span className="border-b-2 border-primary text-primary">type</span>
          </Link>

          <div className="flex min-w-0 items-center gap-3">
            {authLoading ? (
              <div className="h-9 w-24 rounded-md bg-muted" />
            ) : user ? (
              <>
                <div className="hidden min-w-0 items-center gap-2 text-sm text-muted-foreground sm:flex">
                  <UserRound className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{profile?.username ?? user.email}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAccountOpen(true)}
                >
                  <UserRound aria-hidden="true" />
                  Account
                </Button>
              </>
            ) : (
              <Button type="button" size="sm" onClick={() => setModalOpen(true)}>
                <LogIn aria-hidden="true" />
                Sign in
              </Button>
            )}
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-12 text-center">
          <h1 className="font-mono text-4xl font-medium tracking-tight">
            lyric<span className="border-b-2 border-primary text-primary">type</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Search a song. Type the lyrics in time with the music.
          </p>
        </header>

        <form onSubmit={onSearch} className="flex gap-2 border-b-2 border-black py-2">
          <div className="relative flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder=" "
              className="w-full flex-1 rounded-md bg-background px-4 py-3 font-mono text-sm outline-none peer"
            />
            <label
              className={`pointer-events-none absolute left-4 top-3 font-mono text-sm transition-all ${
                q ? "-top-5 text-xs text-muted-foreground" : "text-muted-foreground"
              } peer-focus:-top-5 peer-focus:text-xs peer-focus:text-muted-foreground`}
            >
              Search song or artist...
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-black px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : "Search"}
          </button>
        </form>

        {err && <p className="mt-4 text-sm text-incorrect">{err}</p>}

        <ul className="mt-8 divide-y divide-border">
          {results.map((t) => (
            <li key={t.trackId}>
              <Link
                to="/play/$trackId"
                params={{ trackId: String(t.trackId) }}
                search={{
                  artist: t.artistName,
                  track: t.trackName,
                  preview: t.previewUrl ?? "",
                  art: t.artworkUrl100 ?? "",
                }}
                className="flex items-center gap-4 rounded-md px-2 py-3 transition-colors hover:bg-muted/60"
              >
                {t.artworkUrl100 && (
                  <img src={t.artworkUrl100} alt="" className="h-12 w-12 rounded" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{t.trackName}</p>
                  <p className="truncate text-sm text-muted-foreground">{t.artistName}</p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">play -&gt;</span>
              </Link>
            </li>
          ))}
        </ul>

        <footer className="mt-16 text-center text-xs text-muted-foreground">
          Lyrics via LRCLIB - Previews via iTunes
        </footer>
      </div>

      <AuthModal />
      <AccountModal open={accountOpen} onOpenChange={setAccountOpen} />
    </main>
  );
}
