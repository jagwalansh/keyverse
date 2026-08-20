import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Github, Instagram, Command, Keyboard, Shield, FileText, HelpCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full mt-auto relative z-20 border-t border-border/40 bg-background/80 py-8 text-xs font-mono text-muted-foreground">
      <div className="w-full max-w-5xl mx-auto px-6 flex flex-col gap-6">
        {/* Monkeytype Keyboard Shortcuts Bar */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 px-4 rounded-lg bg-card/40 border border-border/40 text-[11px]">
          <div className="flex items-center gap-1.5">
            <kbd className="mt-key-badge">tab</kbd>
            <span>restart test</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="mt-key-badge">esc</kbd>
            <span>pause / controls</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="mt-key-badge">⌘ + K</kbd>
            <span>search tracks</span>
          </div>
        </div>

        {/* Links and Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <Link to="/about" className="hover:text-foreground transition-colors">
              about
            </Link>
            <Link to="/guide" className="hover:text-foreground transition-colors">
              guide
            </Link>
            <Link to="/leaderboard" className="hover:text-foreground transition-colors">
              leaderboard
            </Link>
            <Link to="/support" className="hover:text-foreground transition-colors">
              contact
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              terms
            </Link>
          </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} keyverse</span>
            <div className="flex items-center gap-3">
              <motion.a
                whileHover={{ scale: 1.15, y: -1 }}
                whileTap={{ scale: 0.95 }}
                href="https://github.com/jagwalansh/updated-lyrictype"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
                title="GitHub"
              >
                <Github className="h-4 w-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.15, y: -1 }}
                whileTap={{ scale: 0.95 }}
                href="https://x.com/jagwalansh"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
                title="X"
              >
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
