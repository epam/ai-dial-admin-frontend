'use client';

import { FC, ReactNode, useEffect, useRef, useState } from 'react';

import { Tooltip } from '@epam/ai-dial-ui-kit';

interface Props {
  text: string;
  children: ReactNode;
}

const OverflowValueTooltip: FC<Props> = ({ text, children }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const field = root.querySelector('input, textarea');
    const target = field instanceof HTMLElement ? field : root;
    const measure = () => setIsOverflowing(target.scrollWidth > target.clientWidth + 1);

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    return () => observer.disconnect();
  }, [text]);

  return (
    <Tooltip tooltip={isOverflowing && text ? text : undefined} triggerClassName="block w-full min-w-0">
      <div ref={rootRef} className="w-full min-w-0" data-overflow-tooltip={isOverflowing ? 'armed' : 'idle'}>
        {children}
      </div>
    </Tooltip>
  );
};

export default OverflowValueTooltip;
