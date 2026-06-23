import type { CSSProperties } from 'react';
type WingsOfFreedomEmblemProps = {
  className?: string;
  style?: CSSProperties;
};

/**
 * Decorative AoT-inspired Wings of Freedom emblem for the cinematic countdown finale.
 */
export function WingsOfFreedomEmblem({ className, style }: WingsOfFreedomEmblemProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 240 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden>
      <path
        d="M120 18c38 0 68 14 88 38v78c0 52-36 98-88 118-52-20-88-66-88-118V56c20-24 50-38 88-38Z"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.55"
      />
      <path
        d="M120 58c-34 18-58 48-66 84 22-8 44-10 66-6 22-4 44-2 66 6-8-36-32-66-66-84Z"
        fill="currentColor"
        opacity="0.35"
      />
      <path
        d="M120 74c-28 14-48 38-54 68 18-6 36-8 54-5 18-3 36-1 54 5-6-30-26-54-54-68Z"
        fill="currentColor"
        opacity="0.5"
      />
      <path
        d="M58 98c-18 10-30 26-34 46 14-4 28-4 42 0-10-14-22-28-42-38 8-6 18-10 34-8Z"
        fill="currentColor"
        opacity="0.42"
      />
      <path
        d="M182 98c18 10 30 26 34 46-14-4-28-4-42 0 10-14 22-28 42-38-8-6-18-10-34-8Z"
        fill="currentColor"
        opacity="0.42"
      />
      <path
        d="M44 148c-8 18-10 36-4 54 12-10 24-16 38-18-6-14-14-26-24-36 4-2 8-2 12 0Z"
        fill="currentColor"
        opacity="0.38"
      />
      <path
        d="M196 148c8 18 10 36 4 54-12-10-24-16-38-18 6-14 14-26 24-36-4-2-8-2-12 0Z"
        fill="currentColor"
        opacity="0.38"
      />
      <path
        d="M120 118v58"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.45"
      />
    </svg>
  );
}
