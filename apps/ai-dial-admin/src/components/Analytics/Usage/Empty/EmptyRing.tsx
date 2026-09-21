'use client';

import { FC, ReactNode } from 'react';

interface Props {
  size: number;
  children: ReactNode;
}

const RING_MASK = 'radial-gradient(farthest-side, transparent calc(100% - 18px), #000 calc(100% - 18px))';

/**
 * The donut's own silhouette, drawn as evenly spaced ticks: the card keeps its shape when the
 * window holds nothing, so the layout does not jump once traffic appears.
 */
const EmptyRing: FC<Props> = ({ size, children }) => (
  <div className="relative" style={{ height: size, width: size }}>
    <div
      aria-hidden
      className="absolute inset-0 opacity-40"
      style={{
        background: 'repeating-conic-gradient(var(--stroke-primary, #333a4d) 0deg 1.4deg, transparent 1.4deg 6deg)',
        WebkitMaskImage: RING_MASK,
        maskImage: RING_MASK,
      }}
    />
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">{children}</div>
  </div>
);

export default EmptyRing;
