import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { searchTracks, fetchSyncedLyrics, type LyricLine, type TrackSearchResult } from "@/lib/lrc";
import { hasCustomLyrics } from "@/lib/custom-lyrics";
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
  Music,
  Crown,
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
  maxCombo?: number;
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

const CONFETTI_COLORS = ["#f97316", "#eab308", "#3b82f6", "#10b981", "#ec4899", "#a855f7"];
const SPRINKLE_PARTICLES = Array.from({ length: 42 }).map((_, i) => ({
  id: i,
  x: (Math.random() - 0.5) * 450,
  y: -130 - Math.random() * 240,
  rotate: Math.random() * 720 - 360,
  size: 4 + Math.random() * 6,
  isCircle: i % 3 === 0,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: 0.95 + (i % 12) * 0.03,
  duration: 1.4 + Math.random() * 0.8,
}));

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
      maxCombo: number;
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
          maxCombo: payload.maxCombo || 0,
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
      const sorted = [...results].sort((a, b) => {
        const aCustom = hasCustomLyrics(a.artistName, a.trackName) ? 1 : 0;
        const bCustom = hasCustomLyrics(b.artistName, b.trackName) ? 1 : 0;
        return bCustom - aCustom;
      });

      setSearchResults(sorted);
      if (sorted.length === 0) {
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

        // Load YouTube video details, community votes from song_video_votes, and lyrics in parallel
        const [ytRes, voteRes, lyricsData] = await Promise.all([
          fetch(`/api/youtube-search?${youtubeParams.toString()}`),
          fetch(`/api/video-votes?songId=${encodeURIComponent(selectedTrack.trackId)}`).catch(() => null),
          fetchSyncedLyrics(artistName, trackName, duration),
        ]);

        if (!ytRes.ok) {
          throw new Error("Failed to load YouTube video for this track.");
        }

        const ytData = (await ytRes.json()) as {
          videoId: string;
          authorName?: string;
          candidates?: YoutubeCandidate[];
        };
        if (!ytData.videoId) {
          throw new Error("No playable YouTube video found for this song.");
        }

        // Load community votes from song_video_votes table
        let voteScores: Record<string, number> = {};
        if (voteRes && voteRes.ok) {
          try {
            const vData = await voteRes.json();
            if (vData && vData.scores) {
              voteScores = vData.scores;
            }
          } catch (e) {
            console.error("Failed to parse vote scores:", e);
          }
        }

        const candidates: YoutubeCandidate[] = ytData.candidates || [
          { videoId: ytData.videoId, authorName: ytData.authorName || "YouTube" },
        ];

        // Pick top voted video candidate if votes exist in song_video_votes, else fallback to algorithm default
        const topVotedCandidate = [...candidates]
          .filter((c) => (voteScores[c.videoId] ?? 0) > 0)
          .sort((a, b) => (voteScores[b.videoId] ?? 0) - (voteScores[a.videoId] ?? 0))[0];

        const chosenVideoId = topVotedCandidate ? topVotedCandidate.videoId : ytData.videoId;

        setVideoId(chosenVideoId);
        setYtCandidates(candidates);

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

        // Broadcast assets to guest so both players use the exact same most-voted video + lyrics
        if (channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "game_assets",
            payload: {
              videoId: chosenVideoId,
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
          maxCombo: maxCombo,
          finished: finishedVal,
        },
      });
    },
    [stats.correct, stats.total, score, maxCombo, myUsername, myUserId],
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
            maxCombo: maxCombo,
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
          maxCombo: maxCombo,
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
        const finalWpm = finalMins > 0 ? Math.round(newCorrect / 5 / finalMins) : 0;

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
      } catch (_) {
        /* ignore if player not ready */
      }
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
          <div className="w-full max-w-sm mx-auto my-16 flex flex-col gap-6">
            <div className="p-6 rounded-xl border border-border/30 bg-card/45 backdrop-blur-sm flex flex-col gap-5 text-center">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Stage Name</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a name for live scoreboards.
                </p>
              </div>

              <form onSubmit={handleSaveScreenName} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="e.g. RhythmTypist"
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                  className="w-full border border-border/30 rounded-lg px-3 py-2.5 bg-background/50 focus:outline-none focus:border-primary text-xs text-center font-medium transition-colors"
                  autoFocus
                  maxLength={18}
                />
                <button
                  type="submit"
                  className="w-full h-9 bg-primary text-primary-foreground font-medium rounded-lg text-xs transition-all hover:bg-primary/90 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Continue <ArrowRight className="h-3.5 w-3.5" />
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-2xl mx-auto my-12 flex flex-col gap-8"
              >
                <div className="text-center flex flex-col items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight">Verses</h1>
                  <p className="text-xs text-muted-foreground">
                    Live rhythm typing multiplayer
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {/* Host Card */}
                  <button
                    onClick={handleCreateLobby}
                    className="flex flex-col justify-between gap-6 p-6 rounded-xl border border-border/30 bg-card/45 backdrop-blur-sm hover:bg-card/70 transition-all text-left group cursor-pointer"
                  >
                    <div>
                      <h2 className="text-base font-semibold tracking-tight">Host a match</h2>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Create a private lobby, select any song, and share the invite code.
                      </p>
                    </div>
                    <span className="text-xs font-mono font-medium text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Create Room &rarr;
                    </span>
                  </button>

                  {/* Join Card */}
                  <div className="flex flex-col justify-between gap-6 p-6 rounded-xl border border-border/30 bg-card/45 backdrop-blur-sm text-left">
                    <div>
                      <h2 className="text-base font-semibold tracking-tight">Join a match</h2>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Enter an invite link or lobby code to connect to a friend.
                      </p>
                    </div>

                    <form onSubmit={handleJoinLobby} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Lobby link or code..."
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value)}
                        className="flex-1 border border-border/30 rounded-lg px-3 h-9 bg-background/50 focus:outline-none focus:border-primary text-xs transition-colors font-mono"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3 border border-border/30 hover:bg-muted text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0"
                      >
                        Join
                      </button>
                    </form>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. State: LOBBY - Active Room */}
            {gameState === "lobby" && (
              <motion.div
                key="lobby"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-3xl mx-auto flex flex-col gap-6"
              >
                {/* Lobby Header bar */}
                <div className="flex items-center justify-between border-b border-border/20 pb-4">
                  <div>
                    <h1 className="text-xl font-bold tracking-tight">Lobby</h1>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      Code: <span className="text-foreground font-semibold">{lobbyId}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyInviteLink}
                      className="h-8 px-3 border border-border/30 hover:bg-muted transition-all text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer font-mono"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-correct" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied ? "Copied" : "Copy Invite"}
                    </button>
                    <button
                      onClick={() => navigate({ to: "/verses", search: {} })}
                      className="h-8 px-3 border border-border/30 hover:bg-destructive/10 hover:text-destructive transition-all text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      Leave
                    </button>
                  </div>
                </div>

                {/* Main Lobby Panels */}
                <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
                  {/* Left Column: Track Search & Selection */}
                  <div className="flex flex-col gap-4">
                    {isHost ? (
                      <div className="p-5 rounded-xl border border-border/30 bg-card/45 flex flex-col gap-3">
                        <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-muted-foreground">
                          Song Selection
                        </h2>

                        <form onSubmit={handleSearchSongs} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Search by track or artist..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 border border-border/30 rounded-lg px-3 h-9 bg-background/50 focus:outline-none focus:border-primary text-xs transition-colors"
                          />
                          <button
                            type="submit"
                            className="h-9 px-3 bg-primary text-primary-foreground transition-all rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Search className="h-3.5 w-3.5" /> Search
                          </button>
                        </form>

                        {/* Search Results */}
                        <div className="max-h-60 overflow-y-auto divide-y divide-border/10 mt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          {searchLoading ? (
                            <div className="py-6 flex justify-center items-center text-xs text-muted-foreground gap-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Searching...
                            </div>
                          ) : (
                            searchResults.map((track) => (
                              <button
                                key={track.id}
                                onClick={() => handleSelectTrack(track)}
                                className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-muted/60 transition-all text-left group cursor-pointer"
                              >
                                {track.artworkUrl100 ? (
                                  <img
                                    src={track.artworkUrl100}
                                    alt={track.trackName}
                                    className="h-8 w-8 rounded object-cover border border-border/10 shrink-0"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary text-xs shrink-0">
                                    <Music className="h-3.5 w-3.5" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-semibold group-hover:text-primary transition-colors">
                                    {track.trackName}
                                  </p>
                                  <p className="truncate text-[10px] text-muted-foreground">
                                    {track.artistName}
                                  </p>
                                </div>
                                <span className="text-[10px] font-mono font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                  SELECT
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border border-border/30 bg-card/45 text-center text-xs text-muted-foreground">
                        Waiting for host to pick a track...
                      </div>
                    )}

                    {/* Selected Track card display */}
                    {selectedTrack ? (
                      <div className="p-4 rounded-xl border border-border/30 bg-card/45 flex items-center gap-3">
                        {selectedTrack.artworkUrl ? (
                          <img
                            src={selectedTrack.artworkUrl}
                            alt={selectedTrack.trackName}
                            className="h-12 w-12 rounded-lg object-cover border border-border/10 shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                            <Music className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-mono text-primary font-semibold uppercase">
                            Selected
                          </p>
                          <h3 className="truncate text-xs font-semibold leading-tight mt-0.5">
                            {selectedTrack.trackName}
                          </h3>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {selectedTrack.artistName}
                          </p>
                        </div>
                        <div className="text-right shrink-0 font-mono text-xs text-muted-foreground">
                          {formatTime(selectedTrack.duration)}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-border/30 text-center text-xs text-muted-foreground/60 font-mono">
                        No song selected.
                      </div>
                    )}
                  </div>

                  {/* Right Column: Participant details */}
                  <div className="flex flex-col gap-4">
                    <div className="p-5 rounded-xl border border-border/30 bg-card/45 flex flex-col gap-3">
                      <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-muted-foreground">
                        Players ({players.length})
                      </h2>

                      {/* Players list */}
                      <ul className="flex flex-col gap-2">
                        {players.map((p) => (
                          <li
                            key={p.userId + "-" + p.socketId}
                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                              p.userId === myUserId
                                ? "bg-card/45 border-border/30"
                                : "bg-card/30 border-border/20"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-semibold truncate">{p.username}</span>
                              {p.userId === myUserId && (
                                <span className="text-[9px] font-mono text-primary border border-primary/30 px-1 rounded">
                                  you
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                                p.isReady
                                  ? "bg-correct/10 text-correct border border-correct/20"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {p.isReady ? "Ready" : "Waiting"}
                            </span>
                          </li>
                        ))}

                        {players.length < 2 && (
                          <li className="p-3 text-center border border-dashed border-border/30 rounded-lg text-xs text-muted-foreground/70">
                            Waiting for opponent...
                          </li>
                        )}
                      </ul>

                      {/* Ready / Start Actions */}
                      <div className="mt-2 pt-3 border-t border-border/20">
                        {isHost ? (
                          <button
                            onClick={handleStartMatch}
                            disabled={
                              players.length < 2 ||
                              !players.filter((p) => !p.isHost).every((p) => p.isReady) ||
                              !selectedTrack
                            }
                            className="w-full h-9 bg-primary text-primary-foreground disabled:opacity-40 transition-all rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" /> Start Match
                          </button>
                        ) : (
                          <button
                            onClick={toggleReady}
                            className={`w-full h-9 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              players.find((p) => p.userId === myUserId)?.isReady
                                ? "border border-correct text-correct hover:bg-correct/5 bg-correct/5"
                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                            }`}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            {players.find((p) => p.userId === myUserId)?.isReady
                              ? "Ready"
                              : "Ready Up"}
                          </button>
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

                {/* 4. State: PLAYING - Active Match */}
            {gameState === "playing" && lyrics && selectedTrack && (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col gap-5"
              >
                {/* Match top bar */}
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Live Match
                  </h2>
                  <button
                    onClick={handleAbandonMatch}
                    className="h-8 px-3 border border-border/30 hover:bg-destructive/10 hover:text-destructive transition-all text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    Abandon
                  </button>
                </div>

                {/* Live player HUD comparisons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Local player stats */}
                  <div className="p-3.5 rounded-xl border border-border/30 bg-card/45 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-primary font-semibold">
                        {myUsername} (You)
                      </span>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        Line {currentLineIdx + 1}/{lyrics.length}
                      </span>
                    </div>

                    <div className="w-full bg-border/20 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${(currentLineIdx / lyrics.length) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                      <span>
                        WPM:{" "}
                        <b className="text-foreground">
                          {activeTypingMs > 0 && stats.total > 0
                            ? Math.round(stats.correct / 5 / (activeTypingMs / 1000 / 60)) || 0
                            : 0}
                        </b>
                      </span>
                      <span>
                        Acc:{" "}
                        <b className="text-foreground">
                          {stats.total ? Math.round((stats.correct / stats.total) * 100) : 0}%
                        </b>
                      </span>
                      <span>
                        Combo: <b className="text-primary">{combo}</b>
                      </span>
                      <span>
                        Score: <b className="text-primary">{score}</b>
                      </span>
                    </div>
                  </div>

                  {/* Opponent player stats */}
                  {players.length > 1 ? (
                    <div className="p-3.5 rounded-xl border border-border/30 bg-card/30 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-muted-foreground font-semibold">
                          {players.find((p) => p.userId !== myUserId)?.username || "Opponent"}
                        </span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {opponentProgress
                            ? `Line ${Math.min(opponentProgress.currentLineIdx + 1, lyrics.length)}/${lyrics.length}`
                            : "Connecting..."}
                        </span>
                      </div>

                      <div className="w-full bg-border/20 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-muted-foreground/60 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              opponentProgress
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
                          Acc:{" "}
                          <b className="text-foreground">{opponentProgress?.accuracy || 0}%</b>
                        </span>
                        <span>
                          Combo: <b className="text-foreground">{opponentProgress?.maxCombo || 0}</b>
                        </span>
                        <span>
                          Score: <b className="text-foreground">{opponentProgress?.score || 0}</b>
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-border/30 bg-card/10 text-center font-mono text-xs text-muted-foreground">
                      Solo Round
                    </div>
                  )}
                </div>

                {/* Lyrics typing arena */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-stretch">
                  {/* Left panel: Lyric display */}
                  <div className="p-6 rounded-xl border border-border/30 bg-card/45 backdrop-blur-sm flex flex-col justify-center items-center min-h-[260px] relative overflow-hidden select-none">
                    {/* Display lines */}
                    <div className="w-full max-w-xl flex flex-col gap-3 justify-center items-center py-4 text-center font-mono relative">
                      {/* Live Combo Counter Indicator */}
                      {combo > 1 && (
                        <div className="text-xs font-mono font-bold text-primary animate-pulse tracking-wider">
                          {combo}x combo
                        </div>
                      )}

                      {/* Active typing line */}
                      {lyrics[currentLineIdx] && (
                        <div className="text-lg md:text-xl font-semibold tracking-wide leading-relaxed text-foreground select-none relative flex flex-wrap justify-center gap-x-1.5 gap-y-1">
                          {lyrics[currentLineIdx].text
                            .split(" ")
                            .reduce((acc: React.ReactNode[], word, wordIdx, array) => {
                              const precedingWordLength = array
                                .slice(0, wordIdx)
                                .reduce((sum, w) => sum + w.length + 1, 0);

                              const wordSpan = (
                                <span key={wordIdx} className="inline-block whitespace-nowrap">
                                  {word.split("").map((ch, idx) => {
                                    const globalIdx = precedingWordLength + idx;
                                    const result = charResults[globalIdx];
                                    const isCaret = globalIdx === charIdx;
                                    let colorClass = "text-muted-foreground/40";

                                    if (isCaret) {
                                      colorClass = "text-foreground font-bold";
                                    } else if (result?.status === "hit") {
                                      colorClass = "text-primary font-bold";
                                    } else if (result?.status === "miss") {
                                      colorClass = "text-incorrect font-bold";
                                    }

                                    return (
                                      <span
                                        key={idx}
                                        className={`relative inline-block ${colorClass}`}
                                      >
                                        {isCaret && (
                                          <motion.span
                                            layoutId="verses-typing-caret"
                                            transition={{
                                              type: "spring",
                                              stiffness: 600,
                                              damping: 35,
                                              mass: 0.2,
                                            }}
                                            className="absolute -left-[1.5px] top-[10%] bottom-[10%] w-[2.5px] bg-primary rounded-full z-10 pointer-events-none shadow-[0_0_8px_rgb(249,115,22,0.6)]"
                                          />
                                        )}
                                        {ch}
                                      </span>
                                    );
                                  })}
                                  {wordIdx < array.length - 1 && (
                                    <span className="relative inline-block">
                                      {precedingWordLength + word.length === charIdx && (
                                        <motion.span
                                          layoutId="verses-typing-caret"
                                          transition={{
                                            type: "spring",
                                            stiffness: 600,
                                            damping: 35,
                                            mass: 0.2,
                                          }}
                                          className="absolute -left-[1.5px] top-[10%] bottom-[10%] w-[2.5px] bg-primary rounded-full z-10 pointer-events-none shadow-[0_0_8px_rgb(249,115,22,0.6)]"
                                        />
                                      )}
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
                        <p className="text-xs text-muted-foreground/40 select-none transition-all">
                          {lyrics[currentLineIdx + 1].text}
                        </p>
                      )}
                    </div>

                    {/* Hidden text input */}
                    <input
                      ref={inputRef}
                      type="text"
                      value=""
                      onChange={() => {}}
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

                    {/* Input focus overlay */}
                    {!inputFocused && !lyricsFinished && (
                      <div
                        onClick={() => inputRef.current?.focus()}
                        className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center cursor-pointer z-25 text-center flex-col gap-1.5"
                      >
                        <p className="text-xs font-semibold text-foreground">
                          Click to resume typing
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right panel: Youtube video */}
                  <div className="p-4 rounded-xl border border-border/30 bg-card/45 flex flex-col justify-between gap-3">
                    <div className="w-full aspect-video rounded-lg bg-black overflow-hidden relative border border-border/10">
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
                      <div className="absolute inset-0 bg-transparent select-none z-10" />
                    </div>

                    <div className="flex items-center justify-between text-left gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate leading-tight">
                          {selectedTrack.trackName}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {selectedTrack.artistName}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setMuted((m) => !m);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                        className="text-muted-foreground hover:text-foreground text-[10px] font-mono font-medium bg-muted/40 hover:bg-muted/70 px-2.5 py-1 rounded border border-border/30 transition-all cursor-pointer shrink-0"
                      >
                        {muted ? "UNMUTE" : "MUTE"}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. State: RESULTS - Match Results */}
            {gameState === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-3xl mx-auto my-8 flex flex-col gap-8 items-center text-center"
              >
                {/* Header with track details */}
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
                    Match Complete
                  </span>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {selectedTrack?.trackName}
                  </h1>
                  <p className="text-xs text-muted-foreground font-medium">
                    {selectedTrack?.artistName}
                  </p>
                </div>

                {/* Podium Stage Scorecards */}
                <div className="flex flex-col md:flex-row gap-6 w-full justify-center items-end relative">
                  {/* Sprinkle Blows Particle Burst */}
                  <div className="absolute -top-16 inset-x-0 h-40 pointer-events-none overflow-visible flex justify-center items-end z-20">
                    {SPRINKLE_PARTICLES.map((p) => (
                      <motion.span
                        key={p.id}
                        initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
                        animate={{
                          x: [0, p.x, p.x * 1.15],
                          y: [0, p.y, p.y + 60],
                          opacity: [0, 1, 0.9, 0],
                          scale: [0, 1.3, 1, 0],
                          rotate: p.rotate,
                        }}
                        transition={{
                          duration: p.duration,
                          delay: p.delay,
                          ease: "easeOut",
                        }}
                        style={{
                          backgroundColor: p.color,
                          width: p.size,
                          height: p.isCircle ? p.size : p.size * 2.2,
                          borderRadius: p.isCircle ? "50%" : "2px",
                          position: "absolute",
                        }}
                      />
                    ))}
                  </div>

                  {Object.keys(matchResults).map((uid) => {
                    const result = matchResults[uid];
                    const maxScore = Math.max(...Object.values(matchResults).map((r) => r.score));
                    const isUserWinner =
                      Object.keys(matchResults).length >= 1 &&
                      result.score === maxScore &&
                      result.score > 0;

                    return (
                      <motion.div
                        key={uid}
                        initial={{ opacity: 0, scaleY: 0.1, y: 40 }}
                        animate={{ opacity: 1, scaleY: 1, y: 0 }}
                        transition={{
                          duration: 0.65,
                          delay: isUserWinner ? 0.35 : 0.1,
                          type: "spring",
                          stiffness: 110,
                          damping: 14,
                        }}
                        style={{ transformOrigin: "bottom center" }}
                        className={`flex-1 w-full rounded-2xl border border-border/30 bg-card/45 flex flex-col items-center justify-between gap-5 text-center relative overflow-hidden backdrop-blur-sm transition-all ${
                          isUserWinner
                            ? "p-8 min-h-[280px]"
                            : "p-5 min-h-[220px]"
                        }`}
                      >
                        {/* Crown Icon on Top Left Corner of Winner's Div */}
                        {isUserWinner && (
                          <div className="absolute top-4 left-4 text-primary">
                            <Crown className="h-4 w-4" />
                          </div>
                        )}
                        {/* Top info header */}
                        <div className="flex flex-col items-center justify-center gap-1 text-center w-full">
                          <p className={`font-bold flex items-center justify-center gap-1.5 ${isUserWinner ? "text-base" : "text-sm"}`}>
                            {result.username}
                            {uid === myUserId && (
                              <span className="text-[9px] font-mono text-primary border border-primary/30 px-1 rounded">
                                you
                              </span>
                            )}
                          </p>

                          {isUserWinner && (
                            <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest mt-0.5">
                              Winner
                            </span>
                          )}
                        </div>

                        {/* 4-Stat Metrics Grid */}
                        <div className="grid grid-cols-2 gap-4 border-t border-border/20 pt-4 mt-1 w-full text-center">
                          <div className="flex flex-col items-center text-center">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                              Score
                            </span>
                            <span className={`font-bold font-mono text-primary mt-0.5 ${isUserWinner ? "text-2xl" : "text-lg"}`}>
                              {result.score.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex flex-col items-center text-center">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                              Accuracy
                            </span>
                            <span className={`font-bold font-mono text-foreground mt-0.5 ${isUserWinner ? "text-2xl" : "text-lg"}`}>
                              {result.accuracy}%
                            </span>
                          </div>

                          <div className="flex flex-col items-center text-center">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                              Speed
                            </span>
                            <span className={`font-bold font-mono text-foreground mt-0.5 ${isUserWinner ? "text-2xl" : "text-lg"}`}>
                              {result.wpm}{" "}
                              <span className="text-xs font-normal text-muted-foreground">WPM</span>
                            </span>
                          </div>

                          <div className="flex flex-col items-center text-center">
                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                              Max Combo
                            </span>
                            <span className={`font-bold font-mono text-primary/90 mt-0.5 ${isUserWinner ? "text-2xl" : "text-lg"}`}>
                              {result.maxCombo || 0}
                              <span className="text-xs font-normal text-muted-foreground">x</span>
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Bottom Action controls */}
                <div className="mt-2">
                  {isHost ? (
                    <button
                      onClick={handleResetLobby}
                      className="h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-all rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                    >
                      Play Again
                    </button>
                  ) : (
                    <p className="text-xs text-muted-foreground font-mono animate-pulse">
                      Waiting for host to restart...
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
