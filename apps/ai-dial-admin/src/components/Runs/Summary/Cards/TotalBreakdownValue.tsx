'use client';

import { FC, ReactNode } from 'react';

import { BreakdownPart } from './models';

interface Props {
  total: ReactNode;
  /** The labelled figures beneath the total, in display order. */
  parts: BreakdownPart[];
  /** Replaces the parts, e.g. the "usually under 10 min" copy while a total is still being calculated. */
  note?: ReactNode;
}

const TotalBreakdownValue: FC<Props> = ({ total, parts, note }) => (
  <div className="flex flex-col gap-2">
    <span className="dial-display2-text text-primary">{total}</span>
    {note != null ? (
      <span className="dial-small-text text-secondary">{note}</span>
    ) : (
      <div className="flex flex-wrap gap-x-4 gap-y-1 dial-small-text">
        {parts.map((part) => (
          <span key={part.label} className="flex gap-1">
            <span className="text-secondary">{part.label}:</span>
            <span className="text-primary">{part.value}</span>
          </span>
        ))}
      </div>
    )}
  </div>
);

export default TotalBreakdownValue;
