'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { ElementSize } from '@epam/ai-dial-ui-kit';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { parseValue } from '@/src/utils/evaluation/detail-panel';
import AdaptiveArrayValueContent from './AdaptiveArrayValueContent';
import AdaptivePrimitiveValueContent from './AdaptivePrimitiveValueContent';
import AdaptiveStructuredValueContent from './AdaptiveStructuredValueContent';
import { ARRAY_PREVIEW_COUNT, LONG_VALUE_THRESHOLD } from './constants';
import {
  createArrayItems,
  createStructuredObjectValue,
  isFlatStringArray,
  isPlainObject,
  safeStringify,
  toPrimitiveValue,
} from './utils';

interface Props {
  label: string;
  value: unknown;
}

const AdaptiveValueRow: FC<Props> = ({ label, value }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isArrayExpanded, setIsArrayExpanded] = useState(false);
  const [expandedArrayItems, setExpandedArrayItems] = useState<Record<number, boolean>>({});

  const isArray = Array.isArray(value);
  const isFlatArray = isFlatStringArray(value);
  const isObject = isPlainObject(value);
  const isArrayLong = isArray && value.length > ARRAY_PREVIEW_COUNT;

  const parsed = useMemo(() => (typeof value === 'string' ? parseValue(value) : null), [value]);

  const arrayItems = useMemo(() => (isArray ? createArrayItems(value) : null), [isArray, value]);

  const structuredValue = useMemo(() => (isObject ? createStructuredObjectValue(value) : null), [isObject, value]);

  const primitiveValue = useMemo(() => toPrimitiveValue(value), [value]);

  const isLong =
    !isArray &&
    ((structuredValue?.isLong ?? false) || (parsed?.isLong ?? false) || primitiveValue.length > LONG_VALUE_THRESHOLD);

  const isRowToggleable = isArray ? isArrayLong : isLong;

  const onToggle = useCallback(() => {
    if (!isRowToggleable) return;
    if (isArray) {
      setIsArrayExpanded((prev) => !prev);
      return;
    }
    setIsExpanded((prev) => !prev);
  }, [isArray, isRowToggleable]);

  const onToggleArrayItem = useCallback((index: number) => {
    setExpandedArrayItems((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const copyValue = isFlatArray
    ? value.join('\n')
    : isArray
      ? safeStringify(value, true)
      : (structuredValue?.rawText ?? parsed?.rawText ?? primitiveValue);

  const visibleItems = arrayItems ? (isArrayExpanded ? arrayItems : arrayItems.slice(0, ARRAY_PREVIEW_COUNT)) : null;

  return (
    <div
      className="group grid grid-cols-[minmax(70px,140px)_1fr_auto] gap-3 px-2 py-3 border-b border-tertiary last:border-b-0 items-start dial-tiny-text hover:bg-layer-3"
      onClick={onToggle}
      role={isRowToggleable ? 'button' : undefined}
    >
      <span className="text-secondary break-words">{label}</span>
      <span className="font-medium min-w-0 break-words">
        {isArray ? (
          <AdaptiveArrayValueContent
            valueLength={value.length}
            visibleItems={visibleItems!}
            isArrayExpanded={isArrayExpanded}
            expandedArrayItems={expandedArrayItems}
            onToggleArrayItem={onToggleArrayItem}
          />
        ) : structuredValue ? (
          <AdaptiveStructuredValueContent structuredValue={structuredValue} isExpanded={isExpanded} />
        ) : (
          <AdaptivePrimitiveValueContent parsed={parsed} isExpanded={isExpanded} primitiveValue={primitiveValue} />
        )}
      </span>
      <CopyButton value={copyValue} valueLabel={label} size={ElementSize.Small} />
    </div>
  );
};

export default AdaptiveValueRow;
