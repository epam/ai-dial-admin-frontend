'use client';

import { FC } from 'react';

import MoveToIcon from '@/public/images/icons/move-to.svg';

interface Props {
  totalItems: number;
  processedItems: number;
  size: number;
  indicatorWidth: number;
}

const ProgressBar: FC<Props> = ({ totalItems, processedItems, size = 100, indicatorWidth = 4 }) => {
  const progress = totalItems === 0 ? 0 : processedItems / totalItems;
  const radius = (size - indicatorWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      <circle
        className="stroke-secondary"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={indicatorWidth}
        fill="none"
      />
      <circle
        className="stroke-info"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={indicatorWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <g transform={`translate(${size / 2 - 18}, ${size / 2 - 18}) scale(2)`}>
        <MoveToIcon />
      </g>
    </svg>
  );
};

export default ProgressBar;
