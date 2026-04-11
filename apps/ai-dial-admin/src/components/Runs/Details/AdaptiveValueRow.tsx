'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { ElementSize } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { parseValue } from '@/src/utils/evaluation/detail-panel';

const ARRAY_PREVIEW_COUNT = 3;

interface Props {
  label: string;
  value: string | string[];
}

const AdaptiveValueRow: FC<Props> = ({ label, value }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isArray = Array.isArray(value);
  const isArrayLong = isArray && (value as string[]).length > ARRAY_PREVIEW_COUNT;

  const parsed = useMemo(() => (isArray ? null : parseValue(value as string)), [isArray, value]);

  const isLong = isArrayLong || (parsed?.isLong ?? false);

  const onToggle = useCallback(() => {
    if (isLong) setIsExpanded((prev) => !prev);
  }, [isLong]);

  const copyValue = isArray ? (value as string[]).join('\n') : (parsed?.rawText ?? '');

  const visibleItems = isArray
    ? isExpanded
      ? (value as string[])
      : (value as string[]).slice(0, ARRAY_PREVIEW_COUNT)
    : null;

  return (
    <div
      className="group grid grid-cols-[minmax(70px,140px)_1fr_auto] gap-3 px-2 py-3 border-b border-tertiary last:border-b-0 items-start dial-tiny-text hover:bg-layer-3"
      onClick={onToggle}
      role={isLong ? 'button' : undefined}
    >
      <span className="text-secondary break-words">{label}</span>
      <span className="font-medium min-w-0 break-words">
        {isArray ? (
          <div className="flex flex-col gap-1">
            {visibleItems!.map((item, i) => (
              <span key={i}>{item}</span>
            ))}
            {!isExpanded && isArrayLong && (
              <span className="text-secondary cursor-pointer hover:text-accent-primary">
                ... and {(value as string[]).length - ARRAY_PREVIEW_COUNT} more
              </span>
            )}
          </div>
        ) : (
          <>
            {parsed?.typeChip && (
              <span className="inline-block text-[9px] font-semibold text-accent-secondary bg-accent-secondary-alpha px-[5px] py-px rounded-sm uppercase tracking-wide mr-1 leading-[14px]">
                {parsed.typeChip}
              </span>
            )}
            {!isExpanded && (
              <span className={parsed?.isLong ? 'line-clamp-2 cursor-pointer hover:text-accent-primary' : ''}>
                {parsed?.displayText}
              </span>
            )}
            {isExpanded && (
              <pre className="mt-1 p-2 bg-layer-0 border border-secondary rounded font-mono text-[11px] whitespace-pre-wrap break-words max-h-[300px] overflow-auto leading-normal">
                {parsed?.rawText}
              </pre>
            )}
          </>
        )}
      </span>
      <CopyButton value={copyValue} valueLabel={label} size={ElementSize.Small} />
    </div>
  );
};

export default AdaptiveValueRow;
