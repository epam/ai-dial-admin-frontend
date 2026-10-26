'use client';

import { FC } from 'react';

export interface ComboLinePoint {
  x: number;
  y: number;
}

interface Props {
  points: (ComboLinePoint | null)[];
  color: string;
  width: number;
  height: number;
}

const ComboTrendLine: FC<Props> = ({ points, color, width, height }) => {
  if (width <= 0 || height <= 0) {
    return null;
  }

  const defined = points.filter((point): point is ComboLinePoint => point != null);
  if (defined.length === 0) {
    return null;
  }

  const polylinePoints = defined.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      {defined.length > 1 && (
        <polyline points={polylinePoints} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
      )}
      {defined.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={4} fill={color} />
      ))}
    </svg>
  );
};

export default ComboTrendLine;
