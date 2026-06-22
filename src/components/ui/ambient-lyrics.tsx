import { useEffect, useState } from "react";

const lyricFragments = [
  "Neon rain keeps time against the glass",
  "We found a chorus hiding in the static",
  "Every red light turns to gold tonight",
  "Your heartbeat lands right after mine",
  "The city hums in a half-forgotten key",
  "Stay for the echo, stay for the sound",
  "Midnight moves like music through the room",
  "We let the silence sing between the lines",
  "One more verse before the morning comes",
  "Streetlights flicker to the rhythm below",
  "I hear tomorrow calling through the noise",
  "The melody remembers where we started",
  "Slow dancing shadows cross the avenue",
  "Hold the note until the sky turns blue",
  "We write our names in beats and afterglow",
  "A quiet spark becomes our loudest song",
];

function shuffleLyrics() {
  const shuffled = [...lyricFragments];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[index]];
  }

  return shuffled;
}

function LyricGroup({ lyrics }: { lyrics: string[] }) {
  return (
    <div className="ambient-lyrics-group">
      {lyrics.map((lyric, index) => (
        <span key={`${lyric}-${index}`} className="ambient-lyric-line">
          {lyric}
        </span>
      ))}
    </div>
  );
}

export function AmbientLyrics() {
  const [leftLyrics, setLeftLyrics] = useState(lyricFragments);
  const [rightLyrics, setRightLyrics] = useState([...lyricFragments].reverse());

  useEffect(() => {
    setLeftLyrics(shuffleLyrics());
    setRightLyrics(shuffleLyrics());
  }, []);

  return (
    <div className="ambient-lyrics" aria-hidden="true">
      <div className="ambient-lyrics-lane ambient-lyrics-lane--left">
        <div className="ambient-lyrics-track">
          <LyricGroup lyrics={leftLyrics} />
          <LyricGroup lyrics={leftLyrics} />
        </div>
      </div>

      <div className="ambient-lyrics-lane ambient-lyrics-lane--right">
        <div className="ambient-lyrics-track">
          <LyricGroup lyrics={rightLyrics} />
          <LyricGroup lyrics={rightLyrics} />
        </div>
      </div>
    </div>
  );
}
