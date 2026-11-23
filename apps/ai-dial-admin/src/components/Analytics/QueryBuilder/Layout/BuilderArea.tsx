'use client';

import { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { ResizeCallback, Resizable } from 're-resizable';

import BuilderAreaHandle from '@/src/components/Analytics/QueryBuilder/Layout/BuilderAreaHandle';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';

interface Props {
  ariaLabel: string;
  children: ReactNode;
}

const STORAGE_KEY = 'query-builder-area-height';
const DEFAULT_HEIGHT = 120;
const MIN_HEIGHT = 80;
const MAX_SHARE = 0.6;
const STEP = 16;
const HANDLE_HEIGHT = 24;

const BuilderArea: FC<Props> = ({ ariaLabel, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [maxHeight, setMaxHeight] = useState(DEFAULT_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);

  const readMaxHeight = useCallback(
    () => Math.max(MIN_HEIGHT, (containerRef.current?.parentElement?.clientHeight ?? 0) * MAX_SHARE),
    [],
  );

  useEffect(() => {
    const stored = Number(getFromLocalStorage(STORAGE_KEY));
    const max = readMaxHeight();
    setMaxHeight(max);
    if (Number.isFinite(stored) && stored > 0) setHeight(Math.min(Math.max(stored, MIN_HEIGHT), max));
  }, [readMaxHeight]);

  const onChangeHeight = useCallback(
    (next: number) => {
      const max = readMaxHeight();
      const clamped = Math.min(Math.max(next, MIN_HEIGHT), max);
      setMaxHeight(max);
      setHeight(clamped);
      setToLocalStorage(STORAGE_KEY, String(Math.round(clamped)));
    },
    [readMaxHeight],
  );

  const onResizeStart = useCallback(() => setIsResizing(true), []);

  const onResizeStop: ResizeCallback = useCallback(
    (_event, _direction, element) => {
      setIsResizing(false);
      onChangeHeight(element.getBoundingClientRect().height);
    },
    [onChangeHeight],
  );

  return (
    <div ref={containerRef} className="-mb-3 shrink-0 pb-6">
      <Resizable
        size={{ width: '100%', height }}
        minHeight={MIN_HEIGHT}
        maxHeight={maxHeight}
        enable={{ bottom: true }}
        handleComponent={{
          bottom: (
            <BuilderAreaHandle
              ariaLabel={ariaLabel}
              height={height}
              minHeight={MIN_HEIGHT}
              maxHeight={maxHeight}
              step={STEP}
              isResizing={isResizing}
              onChangeHeight={onChangeHeight}
            />
          ),
        }}
        handleStyles={{ bottom: { height: HANDLE_HEIGHT, bottom: -HANDLE_HEIGHT, zIndex: 20 } }}
        onResizeStart={onResizeStart}
        onResizeStop={onResizeStop}
        className="flex min-h-0 flex-col"
      >
        <div className="min-h-0 flex-1 overflow-auto rounded border border-secondary bg-layer-2 p-3">{children}</div>
      </Resizable>
    </div>
  );
};

export default BuilderArea;
