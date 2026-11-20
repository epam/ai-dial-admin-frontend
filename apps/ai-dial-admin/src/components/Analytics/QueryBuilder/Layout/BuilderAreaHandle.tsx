'use client';

import { FC, KeyboardEvent } from 'react';

import classNames from 'classnames';

interface Props {
  ariaLabel: string;
  height: number;
  minHeight: number;
  maxHeight: number;
  step: number;
  isResizing: boolean;
  onChangeHeight: (height: number) => void;
}

const BuilderAreaHandle: FC<Props> = ({
  ariaLabel,
  height,
  minHeight,
  maxHeight,
  step,
  isResizing,
  onChangeHeight,
}) => {
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
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      role="separator"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      aria-valuenow={Math.round(height)}
      aria-valuemin={minHeight}
      aria-valuemax={Math.round(maxHeight)}
      onKeyDown={onKeyDown}
      className="group relative flex size-full cursor-ns-resize items-center justify-center outline-hidden focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent-primary"
    >
      {isResizing && (
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-accent-primary" />
      )}
      <span
        aria-hidden
        className={classNames(
          'h-0 w-8 rounded-full border-t-4 transition-colors group-hover:border-accent-primary group-focus-visible:border-accent-primary',
          isResizing ? 'border-accent-primary' : 'border-secondary',
        )}
      />
    </div>
  );
};

export default BuilderAreaHandle;
