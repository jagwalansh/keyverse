import type { SVGProps } from "react";

export function VersesRankIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Top Star */}
      <path
        d="M12 1.5L13.12 3.96L15.8 4.28L13.82 6.08L14.34 8.71L12 7.39L9.66 8.71L10.18 6.08L8.2 4.28L10.88 3.96L12 1.5Z"
        strokeLinejoin="round"
      />
      {/* Central Podium (Rank 1 - Tallest) */}
      <rect x="8" y="10" width="8" height="14" rx="2" />
      {/* Right Podium (Rank 2 - Medium) */}
      <rect x="16.5" y="14" width="5.5" height="10" rx="1.5" opacity="0.6" />
      {/* Left Podium (Rank 3 - Shortest) */}
      <rect x="2" y="17" width="5.5" height="7" rx="1.5" opacity="0.5" />
    </svg>
  );
}
