import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/ui/footer";
import { Navbar } from "@/components/ui/navbar";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Contact & Support | KeyVerse" },
      {
        name: "description",
        content: "Contact KeyVerse for inquiries, feedback, bug reports, and lyric sync issues.",
      },
    ],
    links: [{ rel: "canonical", href: "https://keyverse.me/support" }],
  }),
  component: Support,
});

type Status = "idle" | "sending" | "success" | "preview" | "error";

const PATREON_URL = "https://www.patreon.com/cw/playKeyverse";
const GITHUB_ISSUES_URL = "https://github.com/jagwalansh/updated-lyrictype/issues";
const DISCORD_USERNAME = "nxxei";

export function Support() {
  const [contactOpen, setContactOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [discordCopied, setDiscordCopied] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setContactOpen(open);
    if (!open) {
      setStatus("idle");
      setErrorMessage("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Your message could not be sent.");
      }

      setStatus(data?.delivered === false ? "preview" : "success");
      form.reset();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Your message could not be sent.");
      setStatus("error");
    }
  };

  const sent = status === "success" || status === "preview";

  const handleDiscordCopy = async () => {
    try {
      await navigator.clipboard.writeText(DISCORD_USERNAME);
      setDiscordCopied(true);
      window.setTimeout(() => setDiscordCopied(false), 1800);
    } catch {
      setErrorMessage(`Discord username: @${DISCORD_USERNAME}`);
      setStatus("error");
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-background font-sans text-foreground">
      <Navbar />

      <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-12 px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-border/30 pb-8 text-left md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              // contact & support
            </span>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Get in Touch
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Have questions, feedback, bug reports, or song synchronization requests? Reach out through any channel below.
            </p>
          </div>
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 self-start rounded-md border border-border/40 bg-transparent px-3 py-1.5 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground md:self-auto"
          >
            <span>&larr; back to home</span>
          </Link>
        </header>

        {/* Section 1: Support Channels */}
        <section className="flex flex-col gap-5 text-left">
          <div>
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # channels
            </span>
            <h2 className="mt-1 text-lg font-bold text-foreground">Direct Support Options</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Email Form */}
            <div className="flex flex-col justify-between rounded-lg border border-border/30 bg-transparent p-5">
              <div>
                <span className="font-mono text-xs font-bold text-primary">01 / EMAIL</span>
                <h3 className="mt-2 font-mono text-xs font-bold text-foreground uppercase tracking-wide">
                  Send a Direct Message
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Send an inquiry directly to support@keyverse.me for general help, bugs, or feature suggestions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/20">
                <button
                  type="button"
                  onClick={() => setContactOpen(true)}
                  className="font-mono text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  [ open message form &rarr; ]
                </button>
              </div>
            </div>

            {/* GitHub Issues */}
            <div className="flex flex-col justify-between rounded-lg border border-border/30 bg-transparent p-5">
              <div>
                <span className="font-mono text-xs font-bold text-primary">02 / GITHUB</span>
                <h3 className="mt-2 font-mono text-xs font-bold text-foreground uppercase tracking-wide">
                  Issue Tracker
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Track technical bugs, report gameplay crashes, or contribute to feature roadmaps on GitHub.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/20">
                <a
                  href={GITHUB_ISSUES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs font-bold text-primary hover:underline"
                >
                  [ open github issue &rarr; ]
                </a>
              </div>
            </div>

            {/* Discord */}
            <div className="flex flex-col justify-between rounded-lg border border-border/30 bg-transparent p-5">
              <div>
                <span className="font-mono text-xs font-bold text-primary">03 / DISCORD</span>
                <h3 className="mt-2 font-mono text-xs font-bold text-foreground uppercase tracking-wide">
                  Direct Chat
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Connect with the maintainer directly via Discord for quick questions or feedback.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/20">
                <button
                  type="button"
                  onClick={handleDiscordCopy}
                  className="font-mono text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  [ {discordCopied ? "copied to clipboard" : `copy @${DISCORD_USERNAME}`} ]
                </button>
              </div>
            </div>

            {/* Patreon */}
            <div className="flex flex-col justify-between rounded-lg border border-border/30 bg-transparent p-5">
              <div>
                <span className="font-mono text-xs font-bold text-primary">04 / PATREON</span>
                <h3 className="mt-2 font-mono text-xs font-bold text-foreground uppercase tracking-wide">
                  Support Development
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Support independent hosting, audio API costs, and future game modes on Patreon.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/20">
                <a
                  href={PATREON_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs font-bold text-primary hover:underline"
                >
                  [ view patreon page &rarr; ]
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Sync Reporting FAQ */}
        <section className="flex flex-col gap-5 border-t border-border/20 pt-10 text-left">
          <div>
            <span className="font-mono text-xs font-semibold text-primary uppercase tracking-wider">
              # reporting guide
            </span>
            <h2 className="mt-1 text-lg font-bold text-foreground">Common Inquiries</h2>
          </div>

          <div className="rounded-lg border border-border/30 bg-transparent p-5 sm:p-6 text-xs sm:text-sm leading-relaxed text-muted-foreground space-y-4">
            <div>
              <h4 className="font-mono text-xs font-bold text-foreground uppercase">How do I report lyric desync?</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                Use the in-game report flag during or after a run. It captures the exact track ID and timestamp offsets so they can be recalibrated.
              </p>
            </div>
            <div className="border-t border-border/20 pt-3">
              <h4 className="font-mono text-xs font-bold text-foreground uppercase">Can I request new songs?</h4>
              <p className="mt-1 text-xs text-muted-foreground">
                KeyVerse indexes tracks that have synchronized timestamp data in public lyric libraries. If a song has LRC lyrics available, it will appear in search automatically.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Message Modal */}
      <Dialog.Root open={contactOpen} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-border/40 bg-background p-6 font-mono text-xs shadow-xl">
            <div className="mb-5 flex items-start justify-between border-b border-border/20 pb-3">
              <div>
                <Dialog.Title className="text-sm font-bold uppercase text-foreground">
                  // send message
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-[11px] text-muted-foreground">
                  Drop us a line and we will reply via email.
                </Dialog.Description>
              </div>
              <Dialog.Close className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
                [close]
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase text-muted-foreground">name</span>
                  <input
                    name="name"
                    type="text"
                    required
                    className="h-9 rounded border border-border/50 bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase text-muted-foreground">email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    className="h-9 rounded border border-border/50 bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase text-muted-foreground">subject</span>
                <input
                  name="subject"
                  type="text"
                  placeholder="e.g. Song sync feedback"
                  className="h-9 rounded border border-border/50 bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] uppercase text-muted-foreground">message</span>
                <textarea
                  name="message"
                  rows={5}
                  required
                  placeholder="Type your message here..."
                  className="rounded border border-border/50 bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none resize-none"
                />
              </label>

              <button
                type="submit"
                disabled={status === "sending" || sent}
                className="mt-2 h-9 rounded bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                {status === "sending"
                  ? "sending..."
                  : sent
                    ? "message sent ✓"
                    : "send message"}
              </button>

              {status === "error" && (
                <p className="text-[11px] text-red-400">
                  {errorMessage} (You can also email support@keyverse.me directly).
                </p>
              )}
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Footer />
    </main>
  );
}
