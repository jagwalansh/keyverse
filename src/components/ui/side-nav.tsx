import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Moon, Newspaper, Sun, Search, LifeBuoy } from "lucide-react";
import { lazy, Suspense, useState, useEffect, type ReactNode } from "react";

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
      className={`side-nav-item group relative flex flex-col items-center gap-1.5 w-11 py-3 rounded-2xl ${active ? "side-nav-item--active" : ""}`}
    >
      {active && (
        <span className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" />
      )}
      <span
        className={active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}
      >
        {icon}
      </span>
      <span
        className={`font-mono text-[8px] uppercase tracking-widest font-bold ${active ? "text-primary" : "text-muted-foreground/70 group-hover:text-muted-foreground"}`}
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

  const toggleTheme = () => {
    const isDarkNow = document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", !isDarkNow);
    localStorage.setItem("theme", isDarkNow ? "light" : "dark");
    setIsDark(!isDarkNow);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  const isActive = (to: string, exact = false) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <>
      <aside
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
            to="/articles"
            label="Articles"
            icon={<Newspaper size={15} />}
            isActive={isActive}
          />
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
          <button
            onClick={() => setSearchOpen(true)}
            className="side-nav-item group flex flex-col items-center gap-1.5 w-11 py-3 rounded-2xl cursor-pointer"
            title="Search Songs"
            aria-label="Search songs"
          >
            <span className="text-muted-foreground group-hover:text-foreground">
              <Search size={15} />
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest font-bold text-muted-foreground/70 group-hover:text-muted-foreground">
              Search
            </span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="side-nav-item group flex flex-col items-center gap-1.5 w-11 py-3 rounded-2xl cursor-pointer"
            title="Toggle theme"
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
          >
            <span className="text-muted-foreground group-hover:text-foreground">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest font-bold text-muted-foreground/70 group-hover:text-muted-foreground">
              Theme
            </span>
          </button>
        </div>
      </aside>

      <Suspense fallback={null}>
        {searchOpen && <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />}
      </Suspense>
    </>
  );
}
