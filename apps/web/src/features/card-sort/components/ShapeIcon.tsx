import type { Shape } from '@myapp/types';

interface ShapeIconProps {
  shape: Shape;
  color?: string;
  /** Draw only the outline (used for pile labels). */
  outline?: boolean;
  className?: string;
}

const STAR_POINTS =
  '50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38';

export function ShapeIcon({ shape, color = 'currentColor', outline = false, className }: ShapeIconProps) {
  const paint = outline
    ? { fill: 'none', stroke: color, strokeWidth: 6, strokeLinejoin: 'round' as const }
    : { fill: color };

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={shape}>
      {shape === 'circle' && <circle cx="50" cy="50" r="42" {...paint} />}
      {shape === 'square' && <rect x="10" y="10" width="80" height="80" rx="6" {...paint} />}
      {shape === 'triangle' && <polygon points="50,8 94,90 6,90" {...paint} />}
      {shape === 'star' && <polygon points={STAR_POINTS} {...paint} />}
    </svg>
  );
}
