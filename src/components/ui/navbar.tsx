import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Keyboard,
  Crown,
  Swords,
  LogIn,
  Menu,
  Search,
  UserRound,
  Info,
} from "lucide-react";
import { lazy, Suspense, useState, useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useModal } from "@/lib/modal-context";
import { ThemePicker } from "@/components/ui/theme-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AuthModal = lazy(() =>
  import("@/components/ui/auth-modal").then((module) => ({ default: module.AuthModal })),
);
const SearchModal = lazy(() =>
  import("@/components/ui/search-modal").then((module) => ({ default: module.SearchModal })),
);

type NavbarProps = {
  staticLayout?: boolean;
};

type NavIconProps = {
  to: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
  isActive: (to: string, exact?: boolean) => boolean;
};

function NavIcon({ to, label, icon, exact = false, isActive }: NavIconProps) {
  const active = isActive(to, exact);
  return (
    <Link
      to={to}
      aria-label={label}
      title={label}
      className={`relative flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-md transition-all ${
        active
          ? "text-primary font-bold"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
      }`}
    >
      <span className="scale-95 sm:scale-100">{icon}</span>
      {active && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

export function Navbar({ staticLayout = false }: NavbarProps) {
  const { modalOpen, setModalOpen } = useModal();
  const { user, profile, loading: authLoading } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Global keyboard shortcut for search (Cmd+K / Ctrl+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [staticLayout]);

  const isActive = (to: string, exact = false) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/90 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex min-h-16 py-3 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Left section: Brand name keyverse + Subtitle underneath */}
          <div className="flex items-center shrink-0">
            <Link
              to="/"
              aria-label="KeyVerse home"
              className="group select-none flex flex-col text-left justify-center hover:opacity-90 transition-opacity"
            >
              <span className="flex items-baseline lowercase tracking-normal font-mono text-lg font-bold leading-tight">
                <span className="text-foreground">key</span>
                <span className="border-b-2 border-primary text-primary font-black pb-0.5 ml-0.5">verse</span>
              </span>
              <span className="text-[10px] font-mono text-muted-foreground tracking-tight leading-none mt-0.5">
                Type your Favourite song
              </span>
            </Link>
          </div>

          {/* Right section: Nav Icons + Search + Theme Picker + Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
            {/* Quick Icon Toolbar (Always visible on all screen sizes) */}
            <nav
              className="flex items-center gap-0.5 sm:gap-1.5"
              aria-label="Main navigation"
            >
              <NavIcon
                to="/"
                label="Typing (Home)"
                icon={<Keyboard className="h-4 w-4" />}
                exact
                isActive={isActive}
              />
              <NavIcon
                to="/leaderboard"
                label="Leaderboard (Rankings)"
                icon={<Crown className="h-4 w-4" />}
                isActive={isActive}
              />
              <NavIcon
                to="/verses"
                label="Verses (Multiplayer)"
                icon={<Swords className="h-4 w-4" />}
                isActive={isActive}
              />
              <NavIcon
                to="/guide"
                label="Guide & About"
                icon={<BookOpen className="h-4 w-4" />}
                isActive={isActive}
              />
              
              <div className="h-4 w-px bg-border/60 mx-1 hidden sm:block" />

              {/* Monkeytype Theme Picker */}
              <div className="hidden sm:block">
                <ThemePicker />
              </div>
            </nav>

            <div className="h-4 w-px bg-border/60 mx-0.5 hidden sm:block" />

            {/* Search trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-8 items-center gap-2 rounded-md border border-border/60 bg-secondary/30 hover:bg-secondary/70 px-2.5 sm:px-3 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-xs font-mono"
              aria-label="Search songs"
              title="Search songs (Cmd+K)"
            >
              <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden md:inline">search songs...</span>
              <kbd className="hidden lg:inline-flex items-center rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            <div className="sm:hidden">
              <ThemePicker />
            </div>

            {/* Auth / Profile */}
            {authLoading ? (
              <div className="h-8 w-20 rounded-md bg-muted/40 animate-pulse border border-border/40" />
            ) : user ? (
              <Link
                to="/profile"
                className="border border-border/60 bg-secondary/30 shadow-xs hover:bg-secondary/70 transition-all rounded-md px-3 h-8 cursor-pointer flex items-center justify-center gap-1.5 font-mono text-xs max-w-[160px]"
                aria-label="View profile and stats"
                title="Profile"
              >
                <UserRound
                  className="h-3.5 w-3.5 text-primary shrink-0"
                  aria-hidden="true"
                />
                <span className="font-medium hidden sm:inline text-foreground truncate">
                  {profile?.username || user.email?.split("@")[0] || "Profile"}
                </span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground font-mono font-medium text-xs hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <LogIn className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="shrink-0">Sign in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <Suspense fallback={null}>{modalOpen && <AuthModal />}</Suspense>
      <Suspense fallback={null}>
        {searchOpen && <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />}
      </Suspense>
    </>
  );
}
