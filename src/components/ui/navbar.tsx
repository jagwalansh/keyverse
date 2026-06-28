import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Home,
  LifeBuoy,
  ListOrdered,
  LogIn,
  Menu,
  Moon,
  Newspaper,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
import { lazy, Suspense, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useModal } from "@/lib/modal-context";
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
const THEME_CHANGE_EVENT = "keyverse-theme-change";

type NavbarProps = {
  staticLayout?: boolean;
};

export function Navbar({ staticLayout = false }: NavbarProps) {
  const { modalOpen, setModalOpen } = useModal();
  const { user, loading: authLoading } = useAuth();
  const [windowWidth, setWindowWidth] = useState(1200);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    const syncTheme = () => setIsDark(document.documentElement.classList.contains("dark"));
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark" || savedTheme === "light") {
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    handleResize();
    syncTheme();
    window.addEventListener("resize", handleResize);
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
    };
  }, [staticLayout]);

  const navWidth = Math.min(896, windowWidth - 32);

  const toggleTheme = () => {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  return (
    <>
      <div
        className="liquid-glass-navbar sticky top-0 z-50 mx-auto mb-8 flex items-center overflow-hidden h-[52px]"
        style={{ width: navWidth, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}
      >
        <div className="relative z-10 flex w-full items-center justify-between gap-4 px-6 py-2.5">
          {/* Logo — static kV, no animation */}
          <Link
            to="/"
            aria-label="KeyVerse home"
            className="font-mono text-xl font-medium tracking-tight hover:opacity-90 transition-opacity shrink-0"
          >
            <span className="flex items-baseline">
              <span>key</span>
              <span className="border-b-2 border-primary text-primary">V</span>
              <span className="text-primary">erse</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border/40 bg-card/50 shadow-sm transition-colors hover:bg-card/85 lg:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-4 w-4" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/">
                    <Home /> Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/guide">
                    <BookOpen /> Guide
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/articles">
                    <Newspaper /> Articles
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/support">
                    <LifeBuoy /> Support
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/leaderboard">
                    <ListOrdered /> Leaderboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setSearchOpen(true)}>
                  <Search /> Search songs
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={toggleTheme}>
                  {isDark ? <Sun /> : <Moon />}
                  {isDark ? "Light theme" : "Dark theme"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {authLoading ? (
              <div className="h-8 w-20 rounded-md bg-muted/40 animate-pulse border border-border/40" />
            ) : user ? (
              <Link
                to="/profile"
                className="border border-input bg-background shadow-sm hover:bg-accent transition-all rounded-md px-3 h-8 cursor-pointer flex items-center justify-center gap-1.5"
                aria-label="View profile and stats"
                title="Profile"
              >
                <UserRound
                  className="h-4 w-4 text-foreground hover:text-primary transition-colors duration-200"
                  aria-hidden="true"
                />
                <span className="text-xs font-medium">Profile</span>
              </Link>
            ) : (
              <button
                onClick={() => setModalOpen(true)}
                className="py-1.5 border border-border/40 bg-card/50 hover:bg-card/85 transition-all shadow-sm rounded-md px-3 cursor-pointer flex items-center justify-center h-8"
              >
                <div className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors duration-200 text-xs font-medium shrink-0">
                  <LogIn className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="shrink-0">Sign in</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={null}>{modalOpen && <AuthModal />}</Suspense>
      <Suspense fallback={null}>
        {searchOpen && <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />}
      </Suspense>
    </>
  );
}
