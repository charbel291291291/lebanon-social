import { useId } from "react";

interface FaceLebIconProps {
  className?: string;
}

export function FaceLebIcon({ className }: FaceLebIconProps) {
  const uid = useId();
  const lId = `${uid}-l`;
  const rId = `${uid}-r`;

  return (
    <svg viewBox="0 0 100 106" className={className} aria-hidden xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id={lId}>
          <rect x="0" y="0" width="50" height="106" />
        </clipPath>
        <clipPath id={rId}>
          <rect x="50" y="0" width="50" height="106" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${lId})`}>
        <path fill="#1A4BFF" d="M 6 101 L 40 81 A 38 38 0 1 0 19 66 Z" />
        <circle cx="50" cy="44" r="28" fill="white" />
      </g>

      <g clipPath={`url(#${rId})`}>
        <path fill="#EE0000" d="M 6 101 L 40 81 A 38 38 0 1 0 19 66 Z" />
        <circle cx="50" cy="44" r="28" fill="white" />
      </g>

      <text
        x="24"
        y="62"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="28"
        fill="#1A4BFF"
      >
        F
      </text>
      <text
        x="53"
        y="62"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="28"
        fill="#EE0000"
      >
        L
      </text>
    </svg>
  );
}
