'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { ElementSize } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { parseValue } from '@/src/utils/evaluation/detail-panel';

interface Props {
  label: string;
  value: string;
}

const AdaptiveValueRow: FC<Props> = ({ label, value }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const parsed = useMemo(() => parseValue(value), [value]);

  const onToggle = useCallback(() => {
    if (parsed.isLong) setIsExpanded((prev) => !prev);
  }, [parsed.isLong]);

  return (
    <div
      className="group grid grid-cols-[minmax(70px,140px)_1fr_auto] gap-3 px-2 py-3 border-b border-tertiary last:border-b-0 items-center dial-tiny-text hover:bg-layer-3"
      onClick={onToggle}
      role={parsed.isLong ? 'button' : undefined}
    >
      <span className="text-secondary break-words">{label}</span>
      <span className="font-medium min-w-0 break-words">
        {parsed.typeChip && (
          <span className="inline-block text-[9px] font-semibold text-accent-secondary bg-accent-secondary-alpha px-[5px] py-px rounded-sm uppercase tracking-wide mr-1 leading-[14px]">
            {parsed.typeChip}
          </span>
        )}
        {!isExpanded && (
          <span className={parsed.isLong ? 'line-clamp-2 cursor-pointer hover:text-accent-primary' : ''}>
            {parsed.displayText}
          </span>
        )}
        {isExpanded && (
          <pre className="mt-1 p-2 bg-layer-0 border border-secondary rounded font-mono text-[11px] whitespace-pre-wrap break-words max-h-[300px] overflow-auto leading-normal">
            {parsed.rawText}
          </pre>
        )}
      </span>
      <CopyButton value={parsed.rawText} valueLabel={label} size={ElementSize.Small} />
    </div>
  );
};

export default AdaptiveValueRow;
