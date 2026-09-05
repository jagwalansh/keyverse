import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { TrendingUp, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export type CelebrationData = {
  isNewPb: boolean;
  previousScore: number | null;
  currentScore: number;
  rank: number | null;
  totalPlayers: number | null;
};

/**
 * Ascending harmonic chime synthesized via Web Audio API.
 */
function playVictoryChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const chord = [
      { freq: 523.25, time: 0.0, dur: 0.35 }, // C5
      { freq: 659.25, time: 0.07, dur: 0.35 }, // E5
      { freq: 783.99, time: 0.14, dur: 0.45 }, // G5
      { freq: 1046.5, time: 0.21, dur: 0.8 }, // C6
      { freq: 1318.51, time: 0.25, dur: 0.7 }, // E6
    ];

    chord.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);

      gain.gain.setValueAtTime(0, ctx.currentTime + time);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + dur + 0.1);
    });
  } catch {
    // Autoplay policy or unsupported
  }
}

function fireConfetti() {
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  confetti({
    ...defaults,
    particleCount: 35,
    angle: 60,
    spread: 55,
    origin: { x: 0.15, y: 0.7 },
    colors: ["#e2b714", "#d19a1e", "#10b981", "#f59e0b", "#60a5fa"],
  });

  confetti({
    ...defaults,
    particleCount: 35,
    angle: 120,
    spread: 55,
    origin: { x: 0.85, y: 0.7 },
    colors: ["#e2b714", "#d19a1e", "#10b981", "#f59e0b", "#ec4899"],
  });

  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 30,
      spread: 90,
      origin: { x: 0.5, y: 0.65 },
      colors: ["#e2b714", "#ffffff", "#10b981"],
      shapes: ["star"],
      scalar: 1.1,
    });
  }, 180);
}

export function CelebrationBanner({ data }: { data: CelebrationData }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if ((data.isNewPb || (data.rank !== null && data.rank <= 3)) && !firedRef.current) {
      firedRef.current = true;
      const timer = window.setTimeout(() => {
        fireConfetti();
        playVictoryChime();
      }, 200);
      return () => window.clearTimeout(timer);
    }
  }, [data.isNewPb, data.rank]);

  const showPb = data.isNewPb;
  const showRank = data.rank !== null && data.rank > 0;
  const scoreDelta =
    data.previousScore !== null && data.previousScore > 0
      ? data.currentScore - data.previousScore
      : null;

  if (!showPb && !showRank) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
      className="w-full rounded-xl border border-border/60 bg-card/60 backdrop-blur-md p-3.5 sm:p-4 font-mono text-center select-none shadow-xs"
    >
      <div className="flex flex-col items-center justify-center gap-2">
        {/* Eyebrow Label */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.22em] text-primary/80 uppercase">
          <Sparkles className="h-2.5 w-2.5" />
          <span>
            {data.rank === 1
              ? "Leaderboard Champion"
              : showPb
                ? "Personal Record"
                : "Leaderboard Standing"}
          </span>
          <Sparkles className="h-2.5 w-2.5" />
        </div>

        {/* Clean Headline */}
        <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground uppercase">
          {data.rank === 1
            ? "#1 on the Leaderboard"
            : showPb
              ? "New Personal Best"
              : `Rank #${data.rank} Achieved`}
        </h3>

        {/* Minimalist Stat Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
          {scoreDelta !== null && scoreDelta > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
              <TrendingUp className="h-3 w-3" />
              +{scoreDelta.toLocaleString()} pts
            </span>
          )}

          {scoreDelta === null && showPb && (
            <span className="text-[11px] font-medium text-muted-foreground bg-muted/40 border border-border/50 px-2.5 py-0.5 rounded-md">
              First completion
            </span>
          )}

          {showRank && (
            <span className="inline-flex items-center text-[11px] font-medium text-foreground bg-muted/30 border border-border/50 px-2.5 py-0.5 rounded-md">
              Rank #{data.rank}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
