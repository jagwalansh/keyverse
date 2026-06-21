import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Moon, Sun, Search, LifeBuoy } from "lucide-react";
import { lazy, Suspense, useState, useEffect, type ReactNode } from "react";
import { motion } from "motion/react";

type ViewTransitionDocument = Document & {
  startViewTransition: (callback: () => void) => {
    ready: Promise<void>;
  };
};

const SearchModal = lazy(() =>
  import("@/components/ui/search-modal").then((m) => ({ default: m.SearchModal })),
);
const THEME_CHANGE_EVENT = "keyverse-theme-change";

const HomeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1 6V15H6V11C6 9.89543 6.89543 9 8 9C9.10457 9 10 9.89543 10 11V15H15V6L8 0L1 6Z"
      fill="currentColor"
    />
  </svg>
);

const LeaderboardIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 13V8H5V13H2Z M6 13V4H10V13H6Z M11 13V6H14V13H11Z" fill="currentColor" />
    <path d="M1 14H15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

type NavLinkProps = {
  to: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
  isActive: (to: string, exact?: boolean) => boolean;
};

function NavLink({ to, label, icon, exact = false, isActive }: NavLinkProps) {
  const active = isActive(to, exact);
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={`side-nav-item group relative flex flex-col items-center gap-1.5 w-11 py-3 rounded-2xl transition-all duration-200 ${active ? "side-nav-item--active" : ""}`}
    >
      {active && (
        <motion.span
          layoutId="side-nav-active-bar"
          className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span
        className={`transition-colors duration-200 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
      >
        {icon}
      </span>
      <span
        className={`font-mono text-[8px] uppercase tracking-widest font-bold transition-colors duration-200 ${active ? "text-primary" : "text-muted-foreground/70 group-hover:text-muted-foreground"}`}
      >
        {label}
      </span>
    </Link>
  );
}

export function SideNav() {
  const [isDark, setIsDark] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    const syncTheme = () => setIsDark(document.documentElement.classList.contains("dark"));
    syncTheme();
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
  }, []);

  const toggleTheme = (event: React.MouseEvent) => {
    const isDarkNow = document.documentElement.classList.contains("dark");
    const applyTheme = () => {
      if (isDarkNow) {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
        setIsDark(false);
      } else {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
        setIsDark(true);
      }
      window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    };

    if (!("startViewTransition" in document)) {
      applyTheme();
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    if (isDarkNow) document.documentElement.classList.add("dark-to-light-transition");

    const transition = (document as ViewTransitionDocument).startViewTransition(applyTheme);
    transition.ready.then(() => {
      const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];
      document.documentElement.animate(
        { clipPath: isDarkNow ? [...clipPath].reverse() : clipPath },
        {
          duration: 400,
          easing: "ease-in-out",
          pseudoElement: isDarkNow ? "::view-transition-old(root)" : "::view-transition-new(root)",
        },
      );
    });
    transition.finished.then(() => {
      document.documentElement.classList.remove("dark-to-light-transition");
    });
  };

  const isActive = (to: string, exact = false) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col"
        aria-label="Side navigation"
      >
        {/* Pill container — matches the site's liquid-glass card style */}
        <div className="side-nav-pill flex flex-col items-center gap-0.5 px-2 py-3">
          {/* ── Section 1: Home ── */}
          <NavLink to="/" label="Home" icon={<HomeIcon />} exact isActive={isActive} />

          {/* Divider */}
          <div className="w-5 h-px bg-border/60 my-1.5 rounded-full" />

          {/* ── Section 2: Guide + Support ── */}
          <NavLink to="/guide" label="Guide" icon={<BookOpen size={15} />} isActive={isActive} />
          <NavLink
            to="/support"
            label="Support"
            icon={<LifeBuoy size={15} />}
            isActive={isActive}
          />

          {/* Divider */}
          <div className="w-5 h-px bg-border/60 my-1.5 rounded-full" />

          {/* ── Section 3: Ranks + Search + Theme ── */}
          <NavLink to="/leaderboard" label="Ranks" icon={<LeaderboardIcon />} isActive={isActive} />

          {/* Search — button, not a link */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSearchOpen(true)}
            className="side-nav-item group flex flex-col items-center gap-1.5 w-11 py-3 rounded-2xl transition-all duration-200 cursor-pointer"
            title="Search Songs"
            aria-label="Search songs"
          >
            <span className="text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
              <Search size={15} />
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest font-bold text-muted-foreground/70 group-hover:text-muted-foreground transition-colors duration-200">
              Search
            </span>
          </motion.button>

          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="side-nav-item group flex flex-col items-center gap-1.5 w-11 py-3 rounded-2xl transition-all duration-200 cursor-pointer"
            title="Toggle theme"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          >
            <span className="text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest font-bold text-muted-foreground/70 group-hover:text-muted-foreground transition-colors duration-200">
              Theme
            </span>
          </motion.button>
        </div>
      </motion.aside>

      <Suspense fallback={null}>
        {searchOpen && <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />}
      </Suspense>
    </>
  );
}
