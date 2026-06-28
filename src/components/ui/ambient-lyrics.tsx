const ambientRows = Array.from({ length: 16 }, (_, index) => index);

function AmbientGroup() {
  return (
    <div className="ambient-lyrics-group">
      {ambientRows.map((index) => (
        <span key={index} className="ambient-lyric-line" />
      ))}
    </div>
  );
}

export function AmbientLyrics() {
  return (
    <div className="ambient-lyrics" aria-hidden="true">
      <div className="ambient-lyrics-lane ambient-lyrics-lane--left">
        <div className="ambient-lyrics-track">
          <AmbientGroup />
          <AmbientGroup />
        </div>
      </div>

      <div className="ambient-lyrics-lane ambient-lyrics-lane--right">
        <div className="ambient-lyrics-track">
          <AmbientGroup />
          <AmbientGroup />
        </div>
      </div>
    </div>
  );
}
