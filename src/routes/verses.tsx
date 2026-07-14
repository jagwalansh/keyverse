import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { searchTracks, fetchSyncedLyrics, type LyricLine, type TrackSearchResult } from "@/lib/lrc";
import YouTube, { type YouTubePlayer } from "react-youtube";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import {
  Swords,
  Users,
  Play,
  Copy,
  Check,
  Search,
  Award,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle,
  ArrowRight,
  User,
  Gamepad2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { type RealtimeChannel } from "@supabase/supabase-js";

type VersesSearchParams = {
  lobbyId?: string;
};

export const Route = createFileRoute("/verses")({
  validateSearch: (search: Record<string, unknown>): VersesSearchParams => ({
    lobbyId: typeof search.lobbyId === "string" ? search.lobbyId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verses — Live Rhythm Typing Multiplayer | KeyVerse" },
      {
        name: "description",
        content:
          "Type along to your favorite music in real-time alongside friends or players worldwide in the KeyVerse lobby.",
      },
    ],
    links: [{ rel: "canonical", href: "https://keyverse.me/verses" }],
  }),
  component: VersesRoute,
});

interface PlayerPresence {
  userId: string;
  username: string;
  isHost: boolean;
  isReady: boolean;
  socketId?: string;
}

interface TrackMetadata {
  trackId: string;
  trackName: string;
  artistName: string;
  artworkUrl?: string;
  duration: number;
}

interface ProgressPayload {
  userId: string;
  currentLineIdx: number;
  accuracy: number;
  score: number;
  wpm: number;
  finished: boolean;
}

interface YoutubeCandidate {
  videoId: string;
  authorName: string;
  title?: string;
}

interface CharResult {
  status: "pending" | "hit" | "miss";
  char?: string;
}

interface PresenceDetail {
  username: string;
  isHost: boolean;
  isReady: boolean;
  presence_ref: string;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function VersesRoute() {
  const { lobbyId } = Route.useSearch();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Screen/Guest Name state
  const [screenName, setScreenName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("keyverse_verses_screenname");
      if (saved) return saved;
    }
    return "";
  });

  const [isNameConfirmed, setIsNameConfirmed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("keyverse_verses_screenname");
      if (saved) return true;
    }
    return false;
  });

  const isNameSet = !!profile?.username || isNameConfirmed;

  // Lobby States
  const [gameState, setGameState] = useState<
    "idle" | "lobby" | "countdown" | "playing" | "results"
  >("idle");
  const [players, setPlayers] = useState<PlayerPresence[]>([]);
  const [isHost, setIsHost] = useState<boolean>(false);
  const isHostRef = useRef(false);
  const [joinCodeInput, setJoinCodeInput] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  // Search & Selected Track
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<TrackSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [selectedTrack, setSelectedTrack] = useState<TrackMetadata | null>(null);

  // Realtime Connection References
  const channelRef = useRef<RealtimeChannel | null>(null);
  const playersRef = useRef<PlayerPresence[]>([]);

  // Stable guest ID for guest session
  const [guestUserId] = useState(() => `guest_${Math.random().toString(36).substring(2, 9)}`);
  const myUserId = profile?.id || user?.id || guestUserId;

  const myUsername = profile?.username || screenName || `Guest_${myUserId.substring(0, 5)}`;
  const myUsernameRef = useRef(myUsername);

  useEffect(() => {
    myUsernameRef.current = myUsername;
  }, [myUsername]);

  // Gameplay States
  const [lyrics, setLyrics] = useState<LyricLine[] | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [, setYtCandidates] = useState<YoutubeCandidate[]>([]);
  const [gameLoading, setGameLoading] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  const [playbackEnded, setPlaybackEnded] = useState<boolean>(false);
  const [lyricsFinished, setLyricsFinished] = useState<boolean>(false);

  // Active Typing States (Local Player)
  const [currentLineIdx, setCurrentLineIdx] = useState<number>(0);
  const [charIdx, setCharIdx] = useState<number>(0);
  const [charResults, setCharResults] = useState<CharResult[]>([]);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [stats, setStats] = useState({ correct: 0, total: 0, started: 0 });
  const [activeTypingMs, setActiveTypingMs] = useState<number>(0);
  const [waitingForNext, setWaitingForNext] = useState<string | null>(null);
  const [muted, setMuted] = useState<boolean>(false);

  // Local references to prevent enclosure staleness in intervals/callbacks
  const currentLineIdxRef = useRef(0);
  const charIdxRef = useRef(0);
  const charResultsRef = useRef<CharResult[]>([]);
  const statsStartedRef = useRef(0);
  const activeTypingMsRef = useRef(0);
  const lastActiveTypingTickRef = useRef<number | null>(null);
  const lastActiveTypingRenderRef = useRef(0);
  const currentTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const ytPlayerRef = useRef<YouTubePlayer | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputFocused, setInputFocused] = useState<boolean>(true);

  // Opponent Live Progress HUD & Final Scoreboard States
  const [opponentProgress, setOpponentProgress] = useState<ProgressPayload | null>(null);
  const [matchResults, setMatchResults] = useState<{
    [userId: string]: {
      username: string;
      score: number;
      accuracy: number;
      wpm: number;
      finished: boolean;
    };
  }>({});

  // B7: Reactively mute/unmute the YouTube player when the muted state changes
  useEffect(() => {
    if (!ytPlayerRef.current) return;
    if (muted) {
      ytPlayerRef.current.mute();
    } else {
      ytPlayerRef.current.unMute();
    }
  }, [muted]);


  const handleSaveScreenName = (e: React.FormEvent) => {
    e.preventDefault();
    let finalName = screenName.trim();
    if (finalName.length === 0) {
      finalName = `Guest_${Math.random().toString(36).substring(2, 7)}`;
    } else if (finalName.length < 3) {
      toast.error("Screen name must be at least 3 characters.");
      return;
    }
    setScreenName(finalName);
    sessionStorage.setItem("keyverse_verses_screenname", finalName);
    setIsNameConfirmed(true);
  };

  // 1. Setup Lobby Connection via Supabase Realtime
  useEffect(() => {
    if (!lobbyId || !isNameSet) {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      setPlayers([]);
      playersRef.current = [];
      setGameState("idle");
      return;
    }

    // B5: Guard against missing Supabase configuration
    if (!isSupabaseConfigured || !supabase) {
      toast.error("Live multiplayer is not available (missing configuration).");
      return;
    }

    setGameState("lobby");
    const channel = supabase.channel(`verses:${lobbyId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: myUserId },
      },
    });

    channelRef.current = channel;

    // Track which userIds we've seen, so we only toast on real joins/leaves
    const knownUserIds = new Set<string>();

    // Presence synchronisation — deduplicate per userId (multiple tabs = multiple entries)
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const deduped = new Map<string, PlayerPresence>();

      Object.keys(state).forEach((key) => {
        const presences = state[key] as unknown as PresenceDetail[];
        if (presences.length > 0) {
          // Take the latest presence entry for this userId
          const latest = presences[presences.length - 1];
          deduped.set(key, {
            userId: key,
            username: latest.username,
            isHost: latest.isHost,
            isReady: latest.isReady,
            socketId: latest.presence_ref,
          });
        }
      });

      const list = Array.from(deduped.values());
      setPlayers(list);
      playersRef.current = list;

      // Detect real joins and leaves by comparing with known set
      const currentIds = new Set(list.map((p) => p.userId));
      currentIds.forEach((id) => {
        if (!knownUserIds.has(id) && id !== myUserId) {
          const p = list.find((pl) => pl.userId === id);
          if (p) toast.success(`${p.username} joined the lobby!`);
        }
      });
      knownUserIds.forEach((id) => {
        if (!currentIds.has(id) && id !== myUserId) {
          toast.error(`A player left the lobby.`);
        }
      });
      // Update known set
      knownUserIds.clear();
      currentIds.forEach((id) => knownUserIds.add(id));

      // Determine Host role:
      const myPresence = list.find((p) => p.userId === myUserId);
      if (myPresence) {
        const newIsHost = myPresence.isHost;
        isHostRef.current = newIsHost;
        setIsHost(newIsHost);
      } else {
        const hasHost = list.some((p) => p.isHost);
        const newIsHost = !hasHost;
        isHostRef.current = newIsHost;
        setIsHost(newIsHost);
      }
    });

    // Don't use join/leave events for toasts — they fire on every track() update
    // We handle join/leave detection in the sync handler above

    // Broadcast messages subscription
    channel.on("broadcast", { event: "select_track" }, ({ payload }) => {
      setSelectedTrack(payload);
      toast.info(`Song selected: ${payload.trackName} by ${payload.artistName}`);
    });

    channel.on("broadcast", { event: "start_match" }, ({ payload }) => {
      // Ensure we have the track data (in case we missed the select_track broadcast)
      if (payload.track) {
        setSelectedTrack(payload.track);
      }
      setGameState("countdown");
    });

    // Guest receives game assets (videoId + lyrics) from host
    channel.on("broadcast", { event: "game_assets" }, ({ payload }) => {
      if (payload.videoId) setVideoId(payload.videoId);
      if (payload.lyrics) setLyrics(payload.lyrics);
      setGameLoading(false);
    });

    channel.on("broadcast", { event: "progress" }, ({ payload }) => {
      if (payload.userId !== myUserId) {
        setOpponentProgress(payload);
      }
    });

    channel.on("broadcast", { event: "finished" }, ({ payload }) => {
      setMatchResults((prev) => ({
        ...prev,
        [payload.userId]: {
          username: payload.username,
          score: payload.score,
          accuracy: payload.accuracy,
          wpm: payload.wpm,
          finished: true,
        },
      }));
    });

    channel.on("broadcast", { event: "reset_lobby" }, () => {
      // Clear game states and return to lobby
      setGameState("lobby");
      setSelectedTrack(null);
      setLyrics(null);
      setVideoId(null);
      setOpponentProgress(null);
      setMatchResults({});
      setPlaying(false);
      setPlaybackEnded(false);
      setLyricsFinished(false);
      setCurrentLineIdx(0);
      setCharIdx(0);
      setCharResults([]);
      setCombo(0);
      setMaxCombo(0);
      setScore(0);
      setStats({ correct: 0, total: 0, started: 0 });
      setActiveTypingMs(0);
      setWaitingForNext(null);
      currentLineIdxRef.current = 0;
      charIdxRef.current = 0;
      charResultsRef.current = [];
      statsStartedRef.current = 0;
      activeTypingMsRef.current = 0;
      lastActiveTypingTickRef.current = null;
      currentTimeRef.current = 0;
    });

    // Subscribe to the channel
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // Host is determined by who CREATED the lobby (stored in sessionStorage).
        // This is deterministic and doesn't depend on presence sync timing.
        const shouldBeHost = sessionStorage.getItem(`keyverse_lobby_host_${lobbyId}`) === "true";

        isHostRef.current = shouldBeHost;
        await channel.track({
          username: myUsernameRef.current,
          isHost: shouldBeHost,
          isReady: shouldBeHost, // hosts start ready, challengers must click Ready
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [lobbyId, isNameSet, myUserId]);

  // No "sync host" useEffect — we only call track() on explicit user actions

  // Toggling Guest Ready State — directly calls track()
  const toggleReady = async () => {
    if (!channelRef.current) return;
    // Find current ready state from players list
    const myPresence = players.find((p) => p.userId === myUserId);
    const nextReady = !(myPresence?.isReady ?? false);
    await channelRef.current.track({
      username: myUsername,
      isHost: isHostRef.current,
      isReady: nextReady,
    });
  };

  // 2. Navigation Actions for lobby entrance
  const handleCreateLobby = () => {
    const uuid = crypto.randomUUID();
    // Mark this lobby as created by us so we'll be recognized as host
    sessionStorage.setItem(`keyverse_lobby_host_${uuid}`, "true");
    navigate({
      to: "/verses",
      search: { lobbyId: uuid },
    });
  };

  const handleJoinLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    let targetCode = joinCodeInput.trim();
    if (targetCode.includes("lobbyId=")) {
      try {
        const url = new URL(targetCode);
        const code = url.searchParams.get("lobbyId");
        if (code) targetCode = code;
      } catch (err) {
        // B6: Fallback regex extraction when URL parsing fails
        const match = targetCode.match(/[?&]lobbyId=([^&]+)/);
        if (match?.[1]) targetCode = match[1];
      }
    }

    navigate({
      to: "/verses",
      search: { lobbyId: targetCode },
    });
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/verses?lobbyId=${lobbyId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // 3. Track Search (Host Only)
  const handleSearchSongs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const results = await searchTracks(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        toast.error("No tracks found matching query.");
      }
    } catch (err) {
      toast.error("Failed to search tracks.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectTrack = (track: TrackSearchResult) => {
    if (!isHost || !channelRef.current) return;

    const payload: TrackMetadata = {
      trackId: String(track.id),
      trackName: track.trackName,
      artistName: track.artistName,
      artworkUrl: track.artworkUrl100,
      duration: track.duration || 180,
    };

    setSelectedTrack(payload);
    setSearchResults([]);
    setSearchQuery("");

    // Broadcast track selection
    channelRef.current.send({
      type: "broadcast",
      event: "select_track",
      payload,
    });
  };

  // 4. Host Start Match Trigger
  const handleStartMatch = () => {
    if (!isHost || !channelRef.current) return;

    // Verify guest is ready
    const hasGuest = players.some((p) => !p.isHost);
    const guestReady = players.filter((p) => !p.isHost).every((p) => p.isReady);

    if (!hasGuest) {
      toast.error("Wait for a guest to connect first.");
      return;
    }

    if (!guestReady) {
      toast.error("All guests must be ready before starting.");
      return;
    }

    channelRef.current.send({
      type: "broadcast",
      event: "start_match",
      payload: { track: selectedTrack },
    });
  };

  // 5. Game Assets Load Trigger (Countdown Phase)
  // Only the HOST fetches assets, then broadcasts them so both players use identical data.
  // The GUEST waits for the broadcast.
  useEffect(() => {
    if (gameState !== "countdown" || !selectedTrack) return;

    // Guest: just set loading=true and wait for the game_assets broadcast
    if (!isHostRef.current) {
      setGameLoading(true);
      return;
    }

    // Host: fetch assets, then broadcast to guest
    const loadGameAssets = async () => {
      setGameLoading(true);
      try {
        const { artistName, trackName, duration } = selectedTrack;
        const youtubeParams = new URLSearchParams({
          artist: artistName,
          track: trackName,
          duration: String(duration),
        });

        // Load YouTube video details and lyrics in parallel
        const [ytRes, lyricsData] = await Promise.all([
          fetch(`/api/youtube-search?${youtubeParams.toString()}`),
          fetchSyncedLyrics(artistName, trackName, duration),
        ]);

        if (!ytRes.ok) {
          throw new Error("Failed to load YouTube video for this track.");
        }

        const ytData = (await ytRes.json()) as { videoId: string; candidates?: YoutubeCandidate[] };
        if (!ytData.videoId) {
          throw new Error("No playable YouTube video found for this song.");
        }

        setVideoId(ytData.videoId);
        setYtCandidates(ytData.candidates || []);

        if (!lyricsData || !lyricsData.lines || lyricsData.lines.length === 0) {
          throw new Error("No synced lyrics found for this song.");
        }

        // Simplify lyrics for clean matching (keeps alphanumeric and spaces)
        const simplifiedLines = lyricsData.lines
          .map((l) => ({
            ...l,
            text: l.text
              .toLocaleLowerCase()
              .replace(/[^\p{L}\p{N}\s]/gu, "")
              .replace(/\s+/g, " ")
              .trim(),
          }))
          .filter((l) => l.text.length > 0);

        setLyrics(simplifiedLines);

        // Broadcast assets to guest so they use the exact same video + lyrics
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "game_assets",
            payload: {
              videoId: ytData.videoId,
              lyrics: simplifiedLines,
            },
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load game assets.";
        toast.error(msg);
        // Revert back to lobby
        setGameState("lobby");
      } finally {
        setGameLoading(false);
      }
    };

    loadGameAssets();
  }, [gameState, selectedTrack]);

  // S2: Guest timeout — if game_assets broadcast never arrives, return to lobby
  useEffect(() => {
    if (gameState !== "countdown" || !gameLoading || isHostRef.current) return;
    const timeout = setTimeout(() => {
      toast.error("Host timed out sending game data. Returning to lobby.");
      setGameState("lobby");
      setGameLoading(false);
    }, 15000);
    return () => clearTimeout(timeout);
  }, [gameState, gameLoading]);

  // Countdown timer hook
  const [countdownTime, setCountdownTime] = useState<number>(3);
  useEffect(() => {
    if (gameState !== "countdown" || gameLoading) {
      setCountdownTime(3);
      return;
    }

    const timer = setInterval(() => {
      setCountdownTime((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setGameState("playing");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, gameLoading]);

  // 6. Typing Engine Core Mechanics (Active Match)

  // Autofocus input
  useEffect(() => {
    if (gameState === "playing" && !gameLoading && !lyricsFinished) {
      inputRef.current?.focus();
    }
  }, [gameState, gameLoading, lyricsFinished]);

  // Reset local trackers when gameplay starts
  useEffect(() => {
    if (gameState === "playing" && lyrics) {
      setCurrentLineIdx(0);
      setCharIdx(0);
      setCombo(0);
      setMaxCombo(0);
      setScore(0);
      setStats({ correct: 0, total: 0, started: 0 });
      setActiveTypingMs(0);
      setWaitingForNext(null);
      setPlaybackEnded(false);
      setLyricsFinished(false);

      currentLineIdxRef.current = 0;
      charIdxRef.current = 0;
      charResultsRef.current = new Array(lyrics[0]?.text.length || 0)
        .fill(null)
        .map(() => ({ status: "pending" }));
      setCharResults(charResultsRef.current);
      statsStartedRef.current = 0;
      activeTypingMsRef.current = 0;
      lastActiveTypingTickRef.current = null;
      currentTimeRef.current = 0;
    }
  }, [gameState, lyrics]);

  // Live Opponent Progress periodic broadcast
  const sendProgressUpdate = useCallback(
    (lineIdx: number, finishedVal: boolean = false) => {
      if (!channelRef.current || !stats.total) return;

      const myCorrect = stats.correct;
      const myTotal = stats.total;
      const activeMins = activeTypingMsRef.current / 1000 / 60;
      const currentWpm = activeMins > 0 ? Math.round(myCorrect / 5 / activeMins) : 0;
      const currentAcc = myTotal > 0 ? Math.round((myCorrect / myTotal) * 100) : 0;

      channelRef.current.send({
        type: "broadcast",
        event: finishedVal ? "finished" : "progress",
        payload: {
          userId: myUserId,
          username: myUsername,
          currentLineIdx: lineIdx,
          accuracy: currentAcc,
          score: score,
          wpm: currentWpm,
          finished: finishedVal,
        },
      });
    },
    [stats.correct, stats.total, score, myUsername, myUserId],
  );

  const handleLineComplete = useCallback(
    (timedOut: boolean = false) => {
      if (!lyrics) return;

      const nextLineIdx = currentLineIdxRef.current + 1;
      if (nextLineIdx < lyrics.length) {
        currentLineIdxRef.current = nextLineIdx;
        setCurrentLineIdx(nextLineIdx);

        // Initialize next line character results
        const nextLineText = lyrics[nextLineIdx]?.text || "";
        charIdxRef.current = 0;
        setCharIdx(0);
        charResultsRef.current = new Array(nextLineText.length)
          .fill(null)
          .map(() => ({ status: "pending" }));
        setCharResults(charResultsRef.current);
        setWaitingForNext(null);

        // Periodically sync progress
        sendProgressUpdate(nextLineIdx);
      } else {
        // Last line completed
        setLyricsFinished(true);
        sendProgressUpdate(lyrics.length, true);
        toast.success("You finished typing all lyrics! Waiting for opponent...");

        // Update match results directly for ourselves
        const finalAcc = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
        const finalMins = activeTypingMsRef.current / 1000 / 60;
        const finalWpm = finalMins > 0 ? Math.round(stats.correct / 5 / finalMins) : 0;

        setMatchResults((prev) => ({
          ...prev,
          [myUserId]: {
            username: myUsername,
            score: score,
            accuracy: finalAcc,
            wpm: finalWpm,
            finished: true,
          },
        }));
      }
    },
    [lyrics, stats, score, myUsername, sendProgressUpdate, myUserId],
  );

  // Synchronisation loop (High-Precision updateTime callback)
  const updateTime = useCallback(() => {
    if (ytPlayerRef.current && playing) {
      currentTimeRef.current = ytPlayerRef.current.getCurrentTime();

      if (lyrics && lyrics[currentLineIdxRef.current] && !lyricsFinished) {
        const line = lyrics[currentLineIdxRef.current];
        const nextLineTime = lyrics[currentLineIdxRef.current + 1]?.time || line.time + 6;
        const isWaiting =
          charIdxRef.current >= line.text.length && currentTimeRef.current < nextLineTime;

        // Track active typing minutes
        const isTyping =
          statsStartedRef.current > 0 &&
          currentTimeRef.current >= line.time &&
          !isWaiting &&
          charIdxRef.current < line.text.length;
        const tickNow = performance.now();

        if (isTyping) {
          if (lastActiveTypingTickRef.current !== null) {
            activeTypingMsRef.current += Math.min(tickNow - lastActiveTypingTickRef.current, 300);
          }
          lastActiveTypingTickRef.current = tickNow;

          if (tickNow - lastActiveTypingRenderRef.current > 300) {
            lastActiveTypingRenderRef.current = tickNow;
            setActiveTypingMs(activeTypingMsRef.current);
          }
        } else {
          lastActiveTypingTickRef.current = null;
        }

        // Time limits and Line Advance:
        if (currentTimeRef.current >= nextLineTime) {
          if (charIdxRef.current < line.text.length) {
            // Time out: mark missed characters
            const currentResults = [...charResultsRef.current];
            let misses = 0;
            for (let i = charIdxRef.current; i < line.text.length; i++) {
              if (currentResults[i]?.status !== "hit" && currentResults[i]?.status !== "miss") {
                currentResults[i] = { status: "miss" };
                misses++;
              }
            }

            if (misses > 0) {
              charResultsRef.current = currentResults;
              setCharResults(currentResults);
              setStats((s) => ({
                correct: s.correct,
                total: s.total + misses,
                started: s.started || Date.now(),
              }));
              setCombo(0);
            }
            handleLineComplete(true);
          } else {
            handleLineComplete(false);
          }
        } else if (isWaiting) {
          const diff = (nextLineTime - currentTimeRef.current).toFixed(1);
          setWaitingForNext(diff);
        } else {
          setWaitingForNext(null);
        }
      }
    }

    if (playing) {
      rafRef.current = requestAnimationFrame(updateTime);
    }
  }, [playing, lyrics, lyricsFinished, handleLineComplete]);

  // Bind animation frame loop to play status
  useEffect(() => {
    if (playing) {
      rafRef.current = requestAnimationFrame(updateTime);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      lastActiveTypingTickRef.current = null;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, updateTime]);

  const handlePlaybackEnded = useCallback(() => {
    setPlaying(false);
    setPlaybackEnded(true);
    // Force wrap up gameplay
    if (!lyricsFinished) {
      setLyricsFinished(true);
      sendProgressUpdate(lyrics?.length || 0, true);

      const finalAcc = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
      const finalMins = activeTypingMsRef.current / 1000 / 60;
      const finalWpm = finalMins > 0 ? Math.round(stats.correct / 5 / finalMins) : 0;

      setMatchResults((prev) => ({
        ...prev,
        [myUserId]: {
          username: myUsername,
          score: score,
          accuracy: finalAcc,
          wpm: finalWpm,
          finished: true,
        },
      }));
    }
  }, [lyricsFinished, lyrics, stats, score, myUsername, sendProgressUpdate, myUserId]);

  // Keyboard Event Handlers (Typing Mechanics)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" || e.key === "Tab") {
      e.preventDefault();
      return;
    }

    // Ignore special navigating key strokes
    if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowDown" ||
      e.key === "Delete" ||
      e.key === "Enter"
    ) {
      e.preventDefault();
      return;
    }

    if (!lyrics || lyricsFinished || playbackEnded) return;

    const line = lyrics[currentLineIdxRef.current];
    if (!line) return;

    // Prevent keypresses before line's timing begins
    if (currentTimeRef.current < line.time) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      if (charIdxRef.current > 0) {
        // Backspace behavior (1 character)
        const prevIdx = charIdxRef.current - 1;
        setCombo(0);

        const newResults = [...charResultsRef.current];
        newResults[prevIdx] = { status: "pending" };
        charResultsRef.current = newResults;
        setCharResults(newResults);

        charIdxRef.current = prevIdx;
        setCharIdx(prevIdx);
      }
      return;
    }

    if (e.key.length !== 1 || e.ctrlKey || e.altKey || e.metaKey) return;
    e.preventDefault();

    if (charIdxRef.current >= line.text.length) return;

    const typedChar = e.key;
    // B1: Compare typed character against the expected lyric character
    const expectedChar = line.text[charIdxRef.current];
    const isCorrect = typedChar === expectedChar;

    // Check stats start timestamp
    if (statsStartedRef.current === 0) {
      statsStartedRef.current = Date.now();
      setStats((s) => ({ ...s, started: Date.now() }));
    }

    const nextIdx = charIdxRef.current + 1;
    const newResults = [...charResultsRef.current];
    // B1: Mark as hit or miss based on correctness
    newResults[charIdxRef.current] = { status: isCorrect ? "hit" : "miss", char: typedChar };
    charResultsRef.current = newResults;
    setCharResults(newResults);

    // B3: Combo breaks on wrong character
    const newCombo = isCorrect ? combo + 1 : 0;
    setCombo(newCombo);
    if (isCorrect) setMaxCombo((m) => Math.max(m, newCombo));

    let mult = 1;
    if (newCombo >= 100) mult = 5;
    else if (newCombo >= 50) mult = 3;
    else if (newCombo >= 25) mult = 2;
    else if (newCombo >= 10) mult = 1.5;

    // B1: Only award points for correct characters
    const pts = isCorrect ? Math.floor(10 * mult) : 0;
    if (isCorrect) setScore((s) => s + pts);

    // B2: Only increment correct count when character matches
    setStats((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
      started: s.started || Date.now(),
    }));

    charIdxRef.current = nextIdx;
    setCharIdx(nextIdx);

    if (nextIdx >= line.text.length) {
      if (currentLineIdxRef.current === lyrics.length - 1) {
        // Completed last character of last line
        setLyricsFinished(true);
        sendProgressUpdate(lyrics.length, true);
        toast.success("Match complete! Waiting for opponent.");

        // Sync local match details using updated counters
        const newCorrect = stats.correct + (isCorrect ? 1 : 0);
        const newTotal = stats.total + 1;
        const finalAcc = newTotal > 0 ? Math.round((newCorrect / newTotal) * 100) : 0;
        const finalMins = activeTypingMsRef.current / 1000 / 60;
        const finalWpm = finalMins > 0 ? Math.round((newCorrect / 5) / finalMins) : 0;

        setMatchResults((prev) => ({
          ...prev,
          [myUserId]: {
            username: myUsername,
            score: score + pts,
            accuracy: finalAcc,
            wpm: finalWpm,
            finished: true,
          },
        }));
      }
    }
  };

  // 7. Results Screens Progression (Both finished state monitor)
  const isMatchFinished = useMemo(() => {
    // Both players finished the game
    const guestConnected = players.some((p) => !p.isHost);
    if (!guestConnected) return lyricsFinished; // Solo end

    const allScoresJoined = Object.keys(matchResults).length >= Math.min(players.length, 2);
    return allScoresJoined && Object.values(matchResults).every((r) => r.finished);
  }, [matchResults, players, lyricsFinished]);

  useEffect(() => {
    if (gameState === "playing" && isMatchFinished) {
      setGameState("results");
    }
  }, [gameState, isMatchFinished]);

  // Host resets lobby
  const handleResetLobby = () => {
    if (!isHost || !channelRef.current) return;
    channelRef.current.send({
      type: "broadcast",
      event: "reset_lobby",
      payload: {},
    });
  };

  // Abandon the active match mid-game
  const handleAbandonMatch = () => {
    // Stop YouTube playback immediately
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.stopVideo();
      } catch (_) { /* ignore if player not ready */ }
    }
    // Cancel the animation frame loop
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setPlaying(false);
    // Navigate back to the verses idle screen (leaves the lobby)
    navigate({ to: "/verses", search: {} });
  };

  // Clean elements and references
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <main className="flex flex-col justify-start items-center min-h-screen bg-background text-foreground font-sans relative">
      <Navbar />

      <div className="w-full max-w-5xl mx-auto px-6 py-10 flex flex-col justify-start flex-1 relative z-20">
        {/* State A: Name Setup Modal / View */}
        {!isNameSet ? (
          <div className="w-full max-w-md mx-auto my-12 flex flex-col gap-6">
            <div className="liquid-glass-card p-8 flex flex-col gap-6 text-center border border-border/20">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <User className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Enter Your Stage Name</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Type in a screen name that your friend will see in the lobby and live score
                  screen.
                </p>
              </div>

              <form onSubmit={handleSaveScreenName} className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="e.g. RhythmTypist"
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                  className="w-full border border-border/40 rounded-xl px-4 py-3 bg-card/45 focus:outline-none focus:border-primary text-sm transition-colors text-center font-semibold tracking-wider font-mono text-primary"
                  autoFocus
                  maxLength={18}
                />
                <button
                  type="submit"
                  className="w-full h-11 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow-sm transition-all hover:bg-primary/95 flex items-center justify-center gap-2 cursor-pointer font-mono"
                >
                  Confirm Screen Name <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Render lobby screens based on active state */
          <AnimatePresence mode="wait">
            {/* 1. State: IDLE - Join / Create Lobby options */}
            {gameState === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full max-w-3xl mx-auto my-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch"
              >
                {/* Left Card: Create */}
                <div className="liquid-glass-card p-8 flex flex-col justify-between gap-6 border border-border/20 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:bg-primary/10 transition-all" />
                  <div className="flex flex-col gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                      <Swords className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Host a live lobby</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Create a private match lobby. You will be able to search and pick any song,
                      copy the invite link, and play in real-time alongside your friend.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateLobby}
                    className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-sm rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    Create Match Room &rarr;
                  </button>
                </div>

                {/* Right Card: Join */}
                <div className="liquid-glass-card p-8 flex flex-col justify-between gap-6 border border-border/20 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-secondary/5 rounded-full blur-3xl -z-10 group-hover:bg-secondary/10 transition-all" />
                  <div className="flex flex-col gap-4">
                    <div className="h-10 w-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary border border-secondary/20 shrink-0">
                      <Gamepad2 className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Join a lobby</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Enter the lobby link or the 36-character lobby code shared by your friend to
                      join their private lobby and start typing against them.
                    </p>
                  </div>

                  <form onSubmit={handleJoinLobby} className="flex flex-col gap-2 mt-4">
                    <input
                      type="text"
                      placeholder="Paste lobby link or code..."
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value)}
                      className="border border-border/40 rounded-xl px-4 h-11 bg-card/45 focus:outline-none focus:border-secondary text-xs transition-colors font-mono"
                    />
                    <button
                      type="submit"
                      className="w-full h-11 border border-border/40 hover:bg-muted/70 hover:border-secondary transition-all shadow-sm rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Connect to Lobby
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* 2. State: LOBBY - Active Room */}
            {gameState === "lobby" && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full max-w-4xl mx-auto flex flex-col gap-8"
              >
                {/* Lobby Header bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/25 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                      <Users className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        Verses Lobby
                        <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded-full text-muted-foreground uppercase border border-border/40">
                          Active
                        </span>
                      </h1>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        Lobby Code: <span className="text-primary font-bold">{lobbyId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={copyInviteLink}
                      className="h-10 px-4 border border-border/40 hover:bg-muted/75 transition-all text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer font-mono"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-correct" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? "Copied Invite" : "Copy Invite Link"}
                    </button>
                    <button
                      onClick={() => navigate({ to: "/verses", search: {} })}
                      className="h-10 px-4 border border-border/40 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer font-mono"
                    >
                      Leave Lobby
                    </button>
                  </div>
                </div>

                {/* Main Lobby Panels */}
                <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
                  {/* Left Column: Track Search & Selection */}
                  <div className="flex flex-col gap-6">
                    {isHost ? (
                      <div className="liquid-glass-card p-6 border border-border/20 flex flex-col gap-4">
                        <h2 className="text-sm font-bold font-mono tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                          🎵 Search Track (Host Controls)
                        </h2>

                        <form onSubmit={handleSearchSongs} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Search by artist name or track title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 border border-border/40 rounded-xl px-4 h-11 bg-card/45 focus:outline-none focus:border-primary text-xs transition-colors font-mono"
                          />
                          <button
                            type="submit"
                            className="h-11 px-4 bg-primary text-primary-foreground hover:bg-primary/95 transition-all rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0"
                          >
                            <Search className="h-4 w-4" /> Search
                          </button>
                        </form>

                        {/* Search Results */}
                        <div className="max-h-72 overflow-y-auto divide-y divide-border/20 mt-2">
                          {searchLoading ? (
                            <div className="py-8 flex justify-center items-center text-xs text-muted-foreground gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" /> Searching
                              iTunes database...
                            </div>
                          ) : (
                            searchResults.map((track) => (
                              <button
                                key={track.id}
                                onClick={() => handleSelectTrack(track)}
                                className="w-full flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/70 transition-all text-left group"
                              >
                                {track.artworkUrl100 ? (
                                  <img
                                    src={track.artworkUrl100}
                                    alt={track.trackName}
                                    className="h-9 w-9 rounded-md object-cover border border-border/10 shrink-0"
                                  />
                                ) : (
                                  <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                    ♪
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-semibold group-hover:text-primary transition-colors">
                                    {track.trackName}
                                  </p>
                                  <p className="truncate text-[10px] text-muted-foreground mt-0.5">
                                    {track.artistName}
                                  </p>
                                </div>
                                <span className="text-[10px] font-mono text-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                  SELECT &rarr;
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="liquid-glass-card p-8 border border-border/20 flex flex-col justify-center items-center text-center gap-4 py-16">
                        <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground border border-border/40 shrink-0">
                          🎵
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold tracking-tight">Song Selection</h2>
                          <p className="text-xs text-muted-foreground max-w-xs mt-1">
                            Only the host can search and choose the track. Wait for your friend to
                            select a song!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Selected Track card display */}
                    {selectedTrack ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="liquid-glass-card p-6 border border-border/20 flex items-center gap-4 bg-primary/5 border-primary/20 relative overflow-hidden"
                      >
                        {selectedTrack.artworkUrl ? (
                          <img
                            src={selectedTrack.artworkUrl}
                            alt={selectedTrack.trackName}
                            className="h-16 w-16 rounded-xl object-cover border border-border/10 shrink-0 shadow"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-xl bg-primary/15 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                            ♪
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-mono bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Selected Song
                          </span>
                          <h3 className="truncate text-base font-bold group-hover:text-primary mt-1.5 leading-tight">
                            {selectedTrack.trackName}
                          </h3>
                          <p className="truncate text-xs text-muted-foreground mt-0.5">
                            {selectedTrack.artistName}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-mono font-bold text-primary">
                            {formatTime(selectedTrack.duration)}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                            duration
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="liquid-glass-card p-6 border border-border/20 text-center py-8 text-xs text-muted-foreground font-mono">
                        No song chosen yet.
                      </div>
                    )}
                  </div>

                  {/* Right Column: Participant details */}
                  <div className="flex flex-col gap-6">
                    <div className="liquid-glass-card p-6 border border-border/20 flex flex-col gap-4">
                      <h2 className="text-sm font-bold font-mono tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                        👥 Match Lobby Players ({players.length})
                      </h2>

                      {/* Players list */}
                      <ul className="flex flex-col gap-3">
                        {players.map((p) => (
                          <li
                            key={p.userId + "-" + p.socketId}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${p.userId === myUserId
                                ? "bg-primary/5 border-primary/20"
                                : "bg-card/45 border-border/20"
                              }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-mono font-bold text-primary shrink-0 uppercase border border-border/30">
                                {p.username.substring(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold truncate flex items-center gap-1.5">
                                  {p.username}
                                  {p.userId === myUserId && (
                                    <span className="text-[9px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded-full border border-primary/20">
                                      you
                                    </span>
                                  )}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                  {p.isHost ? "Lobby Host" : "Challenger"}
                                </p>
                              </div>
                            </div>

                            {/* Ready Status indicators */}
                            <div className="shrink-0 flex items-center gap-2">
                              {p.isReady ? (
                                <span className="text-[10px] font-mono bg-correct/10 border border-correct/20 text-correct px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" /> Ready
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold uppercase">
                                  Pending
                                </span>
                              )}
                            </div>
                          </li>
                        ))}

                        {players.length < 2 && (
                          <li className="p-4 text-center border border-dashed border-border/40 rounded-xl bg-card/10 text-xs text-muted-foreground leading-relaxed flex flex-col items-center gap-2 py-8">
                            <span className="animate-bounce">👋</span>
                            Waiting for your friend to join...
                            <span className="text-[10px] font-mono text-muted-foreground/60 max-w-xs mt-1">
                              Copy and send them the invite link above to play together!
                            </span>
                          </li>
                        )}
                      </ul>

                      {/* Ready / Start Actions */}
                      <div className="mt-4 pt-4 border-t border-border/25">
                        {isHost ? (
                          <button
                            onClick={handleStartMatch}
                            disabled={
                              players.length < 2 ||
                              !players.filter((p) => !p.isHost).every((p) => p.isReady) ||
                              !selectedTrack
                            }
                            className="w-full h-11 bg-primary text-primary-foreground disabled:opacity-40 disabled:hover:bg-primary transition-all shadow-sm rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Play className="h-4 w-4 shrink-0 fill-current" /> Start Match
                          </button>
                        ) : (
                          <button
                            onClick={toggleReady}
                            className={`w-full h-11 font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${players.find((p) => p.userId === myUserId)?.isReady
                                ? "border border-correct text-correct hover:bg-correct/5 bg-correct/5"
                                : "bg-primary text-primary-foreground hover:bg-primary/95"
                              }`}
                          >
                            <CheckCircle className="h-4 w-4 shrink-0" />
                            {players.find((p) => p.userId === myUserId)?.isReady
                              ? "Ready!"
                              : "Ready Up"}
                          </button>
                        )}
                        {!selectedTrack && (
                          <p className="text-[10px] text-muted-foreground text-center font-mono mt-2">
                            Select a song first to play.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. State: COUNTDOWN & LOADING */}
            {gameState === "countdown" && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-md mx-auto my-20 flex flex-col items-center text-center justify-center"
              >
                <div className="liquid-glass-card p-10 border border-border/20 flex flex-col items-center justify-center gap-6 relative min-h-60 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-primary/5 animate-pulse -z-10" />

                  {gameLoading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      <h2 className="text-base font-mono font-bold uppercase tracking-wider">
                        Syncing Game Session
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Downloading lyrics draft and preparing playback...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4">
                      <p className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-widest">
                        Match Starting In
                      </p>
                      <motion.h1
                        key={countdownTime}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-8xl font-black text-primary select-none font-mono"
                      >
                        {countdownTime === 0 ? "GO!" : countdownTime}
                      </motion.h1>
                      {selectedTrack && (
                        <div className="mt-4 text-center">
                          <p className="text-xs font-semibold">{selectedTrack.trackName}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {selectedTrack.artistName}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 4. State: PLAYING - Gameplay active split screen layout */}
            {gameState === "playing" && lyrics && selectedTrack && videoId && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col gap-6"
              >
                {/* Match top bar with abandon control */}
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-mono font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Swords className="h-4 w-4 text-primary" /> Live Match
                  </h2>
                  <button
                    onClick={handleAbandonMatch}
                    className="h-8 px-3 border border-border/40 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer font-mono"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Abandon Match
                  </button>
                </div>

                {/* Live Headbar comparisons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Local player stats progress */}
                  <div className="liquid-glass-card p-4 border border-primary/20 bg-primary/5 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="flex items-center gap-1 text-primary">
                        <User className="h-3.5 w-3.5" /> {myUsername} (You)
                      </span>
                      <span>
                        Line {currentLineIdx + 1}/{lyrics.length}
                      </span>
                    </div>

                    <div className="w-full bg-border/20 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${(currentLineIdx / lyrics.length) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span>
                        WPM:{" "}
                        <b className="text-foreground">
                          {/* E5: Guard against Infinity when activeTypingMs is 0 */}
                          {activeTypingMs > 0 && stats.total > 0
                            ? Math.round((stats.correct / 5) / (activeTypingMs / 1000 / 60)) || 0
                            : 0}
                        </b>
                      </span>
                      <span>
                        Accuracy:{" "}
                        <b className="text-foreground">
                          {stats.total ? Math.round((stats.correct / stats.total) * 100) : 0}%
                        </b>
                      </span>
                      <span>
                        Score: <b className="text-primary">{score}</b>
                      </span>
                      <span>
                        Combo: <b className="text-primary">{combo}</b> (max {maxCombo})
                      </span>
                    </div>
                  </div>

                  {/* Opponent player stats progress */}
                  {players.length > 1 ? (
                    <div className="liquid-glass-card p-4 border border-border/20 bg-card/40 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-mono font-bold">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3.5 w-3.5" />{" "}
                          {players.find((p) => p.userId !== myUserId)?.username || "Opponent"}
                        </span>
                        <span>
                          {opponentProgress
                            ? `Line ${Math.min(opponentProgress.currentLineIdx + 1, lyrics.length)}/${lyrics.length}`
                            : "Waiting for update..."}
                        </span>
                      </div>

                      <div className="w-full bg-border/20 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-secondary h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${opponentProgress
                                ? (opponentProgress.currentLineIdx / lyrics.length) * 100
                                : 0
                              }%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                        <span>
                          WPM: <b className="text-foreground">{opponentProgress?.wpm || 0}</b>
                        </span>
                        <span>
                          Accuracy:{" "}
                          <b className="text-foreground">{opponentProgress?.accuracy || 0}%</b>
                        </span>
                        <span>
                          Score: <b className="text-secondary">{opponentProgress?.score || 0}</b>
                        </span>
                        <span>
                          Status:{" "}
                          <b
                            className={
                              opponentProgress?.finished
                                ? "text-correct uppercase"
                                : "text-foreground"
                            }
                          >
                            {opponentProgress?.finished ? "Finished" : "Typing"}
                          </b>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="liquid-glass-card p-4 border border-border/20 bg-card/10 text-center flex items-center justify-center font-mono text-xs text-muted-foreground">
                      Solo Round: No challenger connected.
                    </div>
                  )}
                </div>

                {/* Lyrics typing arena */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-stretch">
                  {/* Left panel: Lyric displays */}
                  <div className="flex flex-col gap-4">
                    <div className="liquid-glass-card p-6 border border-border/20 flex-1 flex flex-col justify-between min-h-[300px] relative overflow-hidden select-none">
                      {/* Sub-Header bar */}
                      <div className="flex justify-between items-center border-b border-border/10 pb-3 mb-4">
                        <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                          Type Lyrics
                        </p>
                        {waitingForNext && (
                          <span className="text-[10px] font-mono font-bold bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full uppercase animate-pulse">
                            Next line in {waitingForNext}s
                          </span>
                        )}
                      </div>

                      {/* Display lines */}
                      <div className="flex-1 flex flex-col justify-center items-center py-6 text-center font-mono relative min-h-48">
                        <div className="w-full max-w-xl flex flex-col gap-6 justify-center">
                          {/* Previous Line */}
                          {currentLineIdx > 0 && lyrics[currentLineIdx - 1] && (
                            <p className="text-xs text-muted-foreground/35 select-none transition-all line-through">
                              {lyrics[currentLineIdx - 1].text}
                            </p>
                          )}

                          {/* Active typing line */}
                          {lyrics[currentLineIdx] && (
                            <div className="text-lg md:text-xl font-bold tracking-wide leading-relaxed text-foreground select-none relative flex flex-wrap justify-center gap-x-1.5 gap-y-1">
                              {lyrics[currentLineIdx].text
                                .split(" ")
                                .reduce((acc: React.ReactNode[], word, wordIdx, array) => {
                                  // Keep track of global character offset
                                  const precedingWordLength = array
                                    .slice(0, wordIdx)
                                    .reduce((sum, w) => sum + w.length + 1, 0);

                                  const wordSpan = (
                                    <span key={wordIdx} className="inline-block whitespace-nowrap">
                                      {word.split("").map((ch, idx) => {
                                        const globalIdx = precedingWordLength + idx;
                                        const result = charResults[globalIdx];
                                        let colorClass = "text-muted-foreground/45";
                                        let spanClass = "";

                                        if (globalIdx === charIdx) {
                                          colorClass = "text-foreground font-black";
                                          spanClass = "border-b-2 border-primary animate-pulse";
                                        } else if (result?.status === "hit") {
                                          colorClass = "text-primary font-black";
                                        } else if (result?.status === "miss") {
                                          colorClass = "text-incorrect font-black";
                                        }

                                        return (
                                          <span
                                            key={idx}
                                            className={`inline-block ${colorClass} ${spanClass}`}
                                          >
                                            {ch}
                                          </span>
                                        );
                                      })}
                                      {/* space placeholder if not last word */}
                                      {wordIdx < array.length - 1 && (
                                        <span
                                          className={`inline-block ${precedingWordLength + word.length === charIdx
                                              ? "border-b-2 border-primary animate-pulse"
                                              : charResults[precedingWordLength + word.length]
                                                ?.status === "hit"
                                                ? "text-primary font-black"
                                                : "text-muted-foreground/45"
                                            }`}
                                        >
                                          &nbsp;
                                        </span>
                                      )}
                                    </span>
                                  );
                                  return [...acc, wordSpan];
                                }, [])}
                            </div>
                          )}

                          {/* Upcoming Line */}
                          {currentLineIdx + 1 < lyrics.length && lyrics[currentLineIdx + 1] && (
                            <p className="text-xs text-muted-foreground/50 select-none transition-all">
                              {lyrics[currentLineIdx + 1].text}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action status notification */}
                      <div className="border-t border-border/10 pt-3 mt-4 flex items-center justify-between text-[10px] font-mono text-muted-foreground relative z-20">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-primary" /> Auto-focuses keyboard.
                          Just type!
                        </span>
                      </div>

                      {/* Hidden text capture element */}
                      <input
                        ref={inputRef}
                        type="text"
                        value=""
                        onChange={() => { }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        autoFocus
                        spellCheck={false}
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-default outline-none z-10"
                      />

                      {/* Input focus warning popup overlay */}
                      {!inputFocused && !lyricsFinished && (
                        <div
                          onClick={() => inputRef.current?.focus()}
                          className="absolute inset-0 bg-background/85 flex items-center justify-center cursor-pointer z-25 text-center flex-col gap-2"
                        >
                          <Gamepad2 className="h-8 w-8 text-primary animate-bounce" />
                          <p className="text-xs font-mono font-bold text-foreground">
                            Click here to resume typing!
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Focus lost. Playback continues, so keep active.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right panel: Youtube iframe element */}
                  <div className="w-full flex flex-col gap-4">
                    <div className="liquid-glass-card p-4 border border-border/20 flex flex-col gap-4 items-center justify-between">
                      <h2 className="w-full text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest border-b border-border/10 pb-2">
                        Music Track
                      </h2>

                      {/* YouTube Player Container */}
                      <div className="w-full aspect-video rounded-xl bg-black overflow-hidden relative border border-border/10">
                        <YouTube
                          videoId={videoId}
                          opts={{
                            height: "100%",
                            width: "100%",
                            playerVars: {
                              autoplay: 1,
                              controls: 0,
                              disablekb: 1,
                              fs: 0,
                              modestbranding: 1,
                              rel: 0,
                              showinfo: 0,
                              iv_load_policy: 3,
                            },
                          }}
                          onPlay={() => setPlaying(true)}
                          onPause={() => setPlaying(false)}
                          onEnd={handlePlaybackEnded}
                          onReady={(e) => {
                            ytPlayerRef.current = e.target;
                            e.target.playVideo();
                            if (muted) {
                              e.target.mute();
                            } else {
                              e.target.unMute();
                            }
                          }}
                          className="w-full h-full"
                        />
                        {/* overlay masking details */}
                        <div className="absolute inset-0 bg-transparent select-none z-10" />
                      </div>

                      {/* Track info card */}
                      <div className="w-full flex items-center justify-between text-left gap-4">
                        <div className="flex-1 min-w-0 flex flex-col">
                          <span className="text-[9px] font-mono text-primary font-bold uppercase">
                            {selectedTrack.artistName}
                          </span>
                          <h4 className="text-xs font-bold leading-tight mt-1 truncate">
                            {selectedTrack.trackName}
                          </h4>
                        </div>
                        <button
                          onClick={() => {
                            setMuted((m) => !m);
                            setTimeout(() => inputRef.current?.focus(), 50);
                          }}
                          className="hover:text-foreground text-muted-foreground flex items-center gap-1.5 cursor-pointer text-[10px] font-mono font-bold bg-muted/40 hover:bg-muted/70 px-3 py-1.5 rounded-lg border border-border/30 transition-all select-none shrink-0"
                        >
                          {muted ? (
                            <VolumeX className="h-3.5 w-3.5" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                          {muted ? "UNMUTE" : "MUTE"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. State: RESULTS - Winner Screen */}
            {gameState === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-4xl mx-auto my-6 flex flex-col gap-8 items-center text-center justify-start"
              >
                {/* Trophy Head */}
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Award className="h-9 w-9 animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Match Results</h1>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      Lyrics round finished for {selectedTrack?.trackName}
                    </p>
                  </div>
                </div>

                {/* Scorecards list comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl justify-center items-stretch">
                  {Object.keys(matchResults).map((uid) => {
                    const result = matchResults[uid];
                    const isUserWinner =
                      Object.keys(matchResults).length === 2 &&
                      result.score === Math.max(...Object.values(matchResults).map((r) => r.score));

                    return (
                      <motion.div
                        key={uid}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`liquid-glass-card p-6 border flex flex-col justify-between gap-6 relative overflow-hidden ${isUserWinner
                            ? "border-amber-400/35 bg-amber-400/[0.03]"
                            : "border-border/20 bg-card/45"
                          }`}
                      >
                        {isUserWinner && (
                          <div className="absolute top-3 right-3 text-xs bg-amber-400/15 border border-amber-400/30 text-amber-500 font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                            Winner 👑
                          </div>
                        )}

                        <div className="flex flex-col items-start gap-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-mono font-bold text-primary shrink-0 uppercase border border-border/30">
                              {result.username.substring(0, 2)}
                            </div>
                            <div className="text-left">
                              <h3 className="text-sm font-bold truncate max-w-40">
                                {result.username}
                              </h3>
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                {uid === myUserId ? "you" : "challenger"}
                              </p>
                            </div>
                          </div>

                          {/* Grid scores */}
                          <div className="grid grid-cols-3 gap-4 w-full border-t border-border/10 pt-4 mt-2">
                            <div className="text-left">
                              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                                Score
                              </p>
                              <p className="text-lg font-black font-mono text-primary mt-1">
                                {result.score}
                              </p>
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                                Accuracy
                              </p>
                              <p className="text-lg font-black font-mono text-foreground mt-1">
                                {result.accuracy}%
                              </p>
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">
                                Speed
                              </p>
                              <p className="text-lg font-black font-mono text-foreground mt-1">
                                {result.wpm}{" "}
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  WPM
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Host Control Actions */}
                <div className="mt-4 pt-4 flex flex-col items-center gap-3">
                  {isHost ? (
                    <button
                      onClick={handleResetLobby}
                      className="h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/95 transition-all shadow-sm rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="h-4 w-4" /> Reset and Play Again
                    </button>
                  ) : (
                    <p className="text-xs text-muted-foreground font-mono animate-pulse">
                      Waiting for the host to reset the lobby...
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <Footer />
    </main>
  );
}
