import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | KeyVerse" },
      {
        name: "description",
        content:
          "Read the KeyVerse privacy policy, including information about accounts, gameplay data, analytics, cookies, and advertising.",
      },
    ],
    links: [{ rel: "canonical", href: "https://keyverse.me/privacy" }],
  }),
  component: Privacy,
});

export function Privacy() {
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
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Last updated: May 2026. This policy explains what information KeyVerse collects, how we use it, and your choices.
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
              # 01 / data collection
            </span>
            <h2 className="text-base font-bold text-foreground">Information We Collect</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              We collect the minimum information needed to run KeyVerse, operate leaderboards, and respond to support:
            </p>
            <ul className="space-y-2 mt-2 font-mono text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold select-none">-</span>
                <span><strong>Account Data:</strong> Email address, authentication IDs, and custom username.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold select-none">-</span>
                <span><strong>Gameplay Data:</strong> Scores, accuracy %, track names, and leaderboard submissions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold select-none">-</span>
                <span><strong>Support Messages:</strong> Submitted contact messages, bug reports, and sync flags.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold select-none">-</span>
                <span><strong>Analytics & Preferences:</strong> Anonymized usage statistics, theme selection, and caret style settings saved locally.</span>
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="flex flex-col gap-2 border-t border-border/20 pt-6">
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # 02 / data usage
            </span>
            <h2 className="text-base font-bold text-foreground">How We Use Information</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              We process data solely to deliver the rhythm typing service, maintain leaderboard records, prevent abuse, improve lyric timestamp matching, and resolve user-reported issues.
            </p>
          </section>

          {/* Section 3 */}
          <section className="flex flex-col gap-2 border-t border-border/20 pt-6">
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # 03 / third party services
            </span>
            <h2 className="text-base font-bold text-foreground">Third-Party Providers</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              KeyVerse integrates with Supabase (authentication and database), LRCLIB (synced lyric timestamps), and public media streaming APIs. We do not sell user personal data to data brokers.
            </p>
          </section>

          {/* Section 4 */}
          <section className="flex flex-col gap-2 border-t border-border/20 pt-6">
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # 04 / user rights
            </span>
            <h2 className="text-base font-bold text-foreground">Data Control & Deletion</h2>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              You can update your profile username or request account and gameplay score deletion at any time by contacting support@keyverse.me.
            </p>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
