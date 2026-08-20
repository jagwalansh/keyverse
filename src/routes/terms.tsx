import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | KeyVerse" },
      {
        name: "description",
        content:
          "Read the KeyVerse terms of service for accounts, fair play, leaderboards, third-party services, and acceptable use.",
      },
    ],
    links: [{ rel: "canonical", href: "https://keyverse.me/terms" }],
  }),
  component: Terms,
});

export function Terms() {
  return (
    <main className="flex flex-col justify-start items-center min-h-screen bg-background text-foreground font-sans relative">
      <Navbar />

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 flex flex-col gap-10 flex-1 justify-start relative z-20">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/30 pb-6 text-left">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              // legal documentation
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Terms of Service
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Last updated: May 2026. Please read these terms carefully before accessing KeyVerse.
            </p>
          </div>

          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 self-start rounded-md border border-border/40 bg-transparent px-3 py-1.5 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground md:self-auto"
          >
            <span>&larr; back to home</span>
          </Link>
        </header>

        {/* Content Block */}
        <div className="text-left flex flex-col gap-8">
          {/* Section 1 */}
          <section className="flex flex-col gap-2">
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # 01 / terms acceptance
            </span>
            <h2 className="text-base font-bold text-foreground">Acceptance of Terms</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              By accessing or using KeyVerse (keyverse.me), you agree to these Terms of Service. If you do not agree to all terms, you may not access or use the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-2 border-t border-border/20 pt-6">
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # 02 / community fair play
            </span>
            <h2 className="text-base font-bold text-foreground">Fair Play & Competitive Rules</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              To maintain competitive leaderboard integrity, the following conduct standards apply:
            </p>
            <ul className="space-y-2 mt-2 font-mono text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold select-none">-</span>
                <span>All keystrokes must be inputted by a human in real time. Autotypers, macros, or bot scripts are prohibited.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold select-none">-</span>
                <span>Tampering with client timestamps or manipulating network requests will result in score invalidation.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold select-none">-</span>
                <span>Usernames must not contain abusive, harassing, or trademark-infringing language.</span>
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-2 border-t border-border/20 pt-6">
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # 03 / intellectual property
            </span>
            <h2 className="text-base font-bold text-foreground">Third-Party Content & Trademarks</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              Song titles, lyrics, artist names, and album artwork belong to their respective copyright holders. KeyVerse utilizes open-source APIs and public streams strictly for educational typing rhythm practice.
            </p>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-2 border-t border-border/20 pt-6">
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # 04 / disclaimer & liability
            </span>
            <h2 className="text-base font-bold text-foreground">Disclaimer of Warranties</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              KeyVerse is provided "as is" and "as available" without warranty of any kind. Service availability, continuous audio streaming, and third-party lyric availability are not guaranteed.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
