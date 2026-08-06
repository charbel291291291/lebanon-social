import { useId } from "react";

interface FaceLebIconProps {
  className?: string;
}

/**
 * FaceLeb speech-bubble logo mark.
 * A circle ring split blue (left / F) + red (right / L) with a chat-bubble tail.
 * viewBox is 100×105; pair with a square size-* class — the slight height
 * difference is invisible at typical navbar/auth sizes.
 */
export function FaceLebIcon({ className }: FaceLebIconProps) {
  const uid = useId();
  const lId = `${uid}-l`;
  const rId = `${uid}-r`;

  return (
    <svg
      viewBox="0 0 100 105"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={lId}>
          <rect x="0" y="0" width="50" height="105" />
        </clipPath>
        <clipPath id={rId}>
          <rect x="50" y="0" width="50" height="105" />
        </clipPath>
      </defs>

      {/* Blue left half — west arc + bubble tail */}
      <g clipPath={`url(#${lId})`}>
        <path fill="#1A4BFF" d="M 43 97 L 50 78 A 36 36 0 1 0 32 73 Z" />
        <circle cx="50" cy="42" r="24" fill="white" />
      </g>

      {/* Red right half — east arc */}
      <g clipPath={`url(#${rId})`}>
        <path fill="#EE0000" d="M 43 97 L 50 78 A 36 36 0 1 0 32 73 Z" />
        <circle cx="50" cy="42" r="24" fill="white" />
      </g>

      {/* F — blue */}
      <text
        x="21"
        y="62"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="36"
        fill="#1A4BFF"
      >
        F
      </text>

      {/* L — red */}
      <text
        x="51"
        y="62"
        fontFamily="Arial Black, sans-serif"
        fontWeight="900"
        fontSize="36"
        fill="#EE0000"
      >
        L
      </text>
    </svg>
  );
}
