'use client';

/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */

import { FC, KeyboardEvent } from 'react';

interface Props {
  ariaLabel: string;
  height: number;
  minHeight: number;
  maxHeight: number;
  step: number;
  onChangeHeight: (height: number) => void;
}

const BuilderAreaHandle: FC<Props> = ({ ariaLabel, height, minHeight, maxHeight, step, onChangeHeight }) => {
  const targets: Record<string, number> = {
    ArrowUp: height - step,
    ArrowDown: height + step,
    Home: minHeight,
    End: maxHeight,
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = targets[event.key];
    if (next == null) return;
    event.preventDefault();
    onChangeHeight(next);
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      aria-valuenow={Math.round(height)}
      aria-valuemin={minHeight}
      aria-valuemax={Math.round(maxHeight)}
      onKeyDown={onKeyDown}
      className="group flex size-full cursor-ns-resize items-center justify-center outline-hidden focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent-primary"
    >
      <span
        aria-hidden
        className="h-0 w-8 rounded-full border-t-4 border-secondary transition-colors group-hover:border-accent-primary group-focus-visible:border-accent-primary"
      />
    </div>
  );
};

export default BuilderAreaHandle;
