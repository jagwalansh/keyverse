import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/ui/navbar";
import { fetchSyncedLyrics, type LyricLine } from "@/lib/lrc";

interface Search {
  artist: string;
  track: string;
  preview: string;
  art: string;
}

const SHOW_TYPING_ERRORS = true;

export const Route = createFileRoute("/play/$trackId")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    artist: String(s.artist ?? ""),
    track: String(s.track ?? ""),
    preview: String(s.preview ?? ""),
    art: String(s.art ?? ""),
  }),
  component: PlayPage,
});

function getAudioType(src: string) {
  const lower = src.split("?")[0].split("#")[0].toLowerCase();
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".m4a") || lower.endsWith(".mp4") || lower.endsWith(".aac"))
    return "audio/mp4";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".ogg") || lower.endsWith(".oga")) return "audio/ogg";
  return "";
}

function PlayPage() {
  const { artist, track, preview, art } = Route.useSearch();
  const [lines, setLines] = useState<LyricLine[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [typed, setTyped] = useState("");
  const [stats, setStats] = useState({ correct: 0, total: 0, started: 0 });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const lyricsRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioType, setAudioType] = useState("");
  const [playing, setPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioErr, setAudioErr] = useState<string | null>(null);
  const [previewSupported, setPreviewSupported] = useState(true);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchSyncedLyrics(artist, track)
      .then((r) => {
        if (cancelled) return;
        if (!r || r.length === 0) setLoadErr("No synced lyrics found for this song.");
        else setLines(r);
      })
      .catch(() => !cancelled && setLoadErr("Failed to load lyrics."));
    return () => {
      cancelled = true;
    };
  }, [artist, track]);

  // Set audio type when preview URL is available
  useEffect(() => {
    if (preview) {
      const type = getAudioType(preview);
      setAudioType(type);
      setPreviewSupported(!!type);
    }
  }, [preview]);

  // YouTube search has been removed to use fallback audio directly

  const fullText = useMemo(() => {
    if (!lines) return "";
    return lines.map((l) => l.text).join("\n");
  }, [lines]);

  // Scroll to current line
  useEffect(() => {
    if (!lyricsRef.current) return;
    const lines = lyricsRef.current.querySelectorAll("[data-line-idx]");
    const currentLine = lines[currentLineIdx] as HTMLElement;
    if (currentLine) {
      currentLine.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentLineIdx]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!fullText || !lines) return;
    const v = e.target.value.toLowerCase();

    // Check if user pressed Enter to move to next line
    if (e.nativeEvent instanceof KeyboardEvent && e.nativeEvent.key === "Enter") {
      setTyped("");
      setCurrentLineIdx((idx) => Math.min(idx + 1, lines.length - 1));
      return;
    }

    // Get current line
    const currentLine = lines[currentLineIdx]?.text || "";

    // Check if typed matches current line (allowing some flexibility)
    if (v.length > currentLine.length) return;

    if (v.length > typed.length) {
      const newChars = v.slice(typed.length);
      let c = 0;
      for (let i = 0; i < newChars.length; i++) {
        const typedChar = v[typed.length + i]?.toLowerCase() || "";
        const lineChar = currentLine[typed.length + i]?.toLowerCase() || "";
        if (typedChar === lineChar) c++;
      }
      setStats((s) => ({
        correct: s.correct + c,
        total: s.total + newChars.length,
        started: s.started || Date.now(),
      }));
    }
    setTyped(v);
  }

  const accuracy = stats.total ? Math.round((stats.correct / stats.total) * 100) : 100;
  const elapsed = stats.started ? (Date.now() - stats.started) / 1000 / 60 : 0;
  const wpm = elapsed > 0 ? Math.round(stats.correct / 5 / elapsed) : 0;

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch((err) => {
        console.error("Play error:", err);
        setAudioErr("Failed to play audio.");
      });
      setPlaying(true);
    }
    inputRef.current?.focus();
  }

  function restart() {
    setTyped("");
    setCurrentLineIdx(0);
    setStats({ correct: 0, total: 0, started: 0 });

    // Reset audio to beginning
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      // Auto-play if audio is ready
      if (audioReady) {
        audioRef.current.play().catch((err) => console.error("Play error:", err));
      }
    }

    inputRef.current?.focus();
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground font-sans flex flex-col items-center">
      <Navbar />

      {/* Content Overlay */}
      <div className="relative z-20 w-full max-w-6xl px-6 pb-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link to="/" className="font-mono text-xs text-muted-foreground hover:text-foreground">
            ← back
          </Link>

          <div className="flex items-center gap-6 font-mono text-sm border border-border/40 bg-card/45 backdrop-blur-md shadow-sm rounded-full px-5 py-2">
            <div>
              <span className="text-primary font-bold text-base">{wpm}</span>{" "}
              <span className="text-muted-foreground text-xs">wpm</span>
            </div>
            <div className="w-px h-4 bg-border/40" />
            <div>
              <span className="text-primary font-bold text-base">{accuracy}%</span>{" "}
              <span className="text-muted-foreground text-xs">acc</span>
            </div>
          </div>
        </div>

        {loadErr && (
          <div className="mt-10 rounded-md border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">{loadErr}</p>
          </div>
        )}

        {!lines && !loadErr && (
          <p className="mt-10 text-center font-mono text-sm text-muted-foreground">
            Loading lyrics…
          </p>
        )}

        {lines && (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 items-start">
            {/* Left Column: Song Information Card & How to Play */}
            <div className="flex flex-col gap-4">
              <div className="relative w-full  aspect-video rounded-xl overflow-hidden border border-border/40 shadow-lg bg-muted/10 flex flex-col items-center justify-center p-6 text-center">
                {art ? (
                  <img src={art} alt="" className="h-28 w-28 rounded-lg shadow-md mb-4" />
                ) : (
                  <div className="h-28 w-28 rounded-lg bg-muted mb-4 animate-pulse" />
                )}
                <h2 className="text-xl font-bold tracking-tight text-foreground">{track}</h2>
                <p className="text-sm text-muted-foreground mt-1">{artist}</p>
              </div>

              {/* <div className="rounded-xl border border-border/40 bg-card/45 backdrop-blur-md p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">How to Play</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Start the music by clicking <strong>Play</strong>. Focus the screen and start typing what you hear. Press <strong>Enter</strong> to advance to the next line.
                </p>
              </div> */}
            </div>

            {/* Right Column: Game and Lyrics */}
            <div className="flex flex-col gap-6">
              {/* Spotify-style lyrics display */}
              <div
                ref={lyricsRef}
                className="relative h-[360px] overflow-hidden rounded-xl bg-gradient border border-border/40 shadow-inner px-6 py-10 cursor-pointer"
                onClick={() => inputRef.current?.focus()}
              >
                {lines.map((line, idx) => {
                  const isCurrentLine = idx === currentLineIdx;
                  const isPassed = idx < currentLineIdx;
                  const lineText = line.text;

                  return (
                    <div
                      key={idx}
                      data-line-idx={idx}
                      className={`mb-8 text-center transition-all duration-300 ${
                        isCurrentLine ? "scale-105" : "scale-95"
                      } ${isPassed ? "opacity-35" : "opacity-100"}`}
                    >
                      <div className="text-2xl font-bold leading-relaxed">
                        {isCurrentLine
                          ? // Display current line with character-by-character feedback
                            lineText.split("").map((ch, charIdx) => {
                              const typedChar = typed[charIdx];
                              let className = "text-muted-foreground";

                              if (charIdx < typed.length) {
                                const isCorrect = typedChar?.toLowerCase() === ch.toLowerCase();
                                if (isCorrect) {
                                  className = "text-correct font-semibold";
                                } else if (!SHOW_TYPING_ERRORS) {
                                  className = "text-correct font-semibold";
                                } else if (SHOW_TYPING_ERRORS) {
                                  className =
                                    "text-incorrect underline decoration-incorrect font-semibold";
                                }
                              } else if (charIdx === typed.length) {
                                className = "text-foreground animate-pulse";
                              }

                              return (
                                <span key={charIdx} className={className}>
                                  {ch}
                                </span>
                              );
                            })
                          : // Display other lines as-is
                            lineText}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hidden input for capturing keyboard events */}
              <input
                ref={inputRef}
                value={typed}
                onChange={onChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setTyped("");
                    setCurrentLineIdx((idx) => Math.min(idx + 1, lines.length - 1));
                  }
                }}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                className="sr-only"
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  disabled={!preview || !previewSupported || !audioReady}
                  className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-40 cursor-pointer flex items-center justify-center"
                >
                  {playing ? "Pause" : "Play"}
                </button>
                <button
                  onClick={restart}
                  className="rounded-lg border border-border/40 bg-card/45 backdrop-blur-sm py-2.5 px-6 text-sm font-semibold hover:bg-muted transition-colors cursor-pointer"
                >
                  Restart
                </button>
              </div>

              {/* Render fallback html audio element if no youtube video is playing */}
              {preview && previewSupported && (
                <>
                  <audio
                    ref={audioRef}
                    src={preview}
                    type={audioType}
                    preload="auto"
                    onPlay={() => setPlaying(true)}
                    onPause={() => setPlaying(false)}
                    onEnded={() => setPlaying(false)}
                    onError={(e) => {
                      console.log("audio error", e);
                      setAudioErr("Audio preview failed to load.");
                      setAudioReady(false);
                      setPlaying(false);
                    }}
                    onLoadedData={() => {
                      setAudioErr(null);
                      setAudioReady(true);
                    }}
                    onCanPlayThrough={() => {
                      setAudioReady(true);
                    }}
                  />
                  {audioErr && (
                    <p className="text-center text-xs text-incorrect">{audioErr}</p>
                  )}
                  {!audioReady && !audioErr && (
                    <p className="text-center text-xs text-muted-foreground animate-pulse">
                      Loading audio preview…
                    </p>
                  )}
                </>
              )}

              {!preview && (
                <p className="text-center text-xs text-incorrect">
                  No audio preview available — type at your own pace.
                </p>
              )}

              <p className="text-center font-mono text-xs text-muted-foreground leading-relaxed">
                Just start typing — press <span className="font-bold border border-border/40 px-1 py-0.5 rounded shadow-sm bg-muted/40">Enter</span> to go to the next line.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
