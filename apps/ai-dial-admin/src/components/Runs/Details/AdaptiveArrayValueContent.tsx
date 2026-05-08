'use client';

import { FC } from 'react';

import TypeChip from './AdaptiveValueTypeChip';
import { ARRAY_PREVIEW_COUNT } from './constants';
import { ArrayItemViewModel } from './types';

interface ArrayValueContentProps {
  valueLength: number;
  visibleItems: ArrayItemViewModel[];
  isArrayExpanded: boolean;
  expandedArrayItems: Record<number, boolean>;
  onToggleArrayItem: (index: number) => void;
}

const AdaptiveArrayValueContent: FC<ArrayValueContentProps> = ({
  valueLength,
  visibleItems,
  isArrayExpanded,
  expandedArrayItems,
  onToggleArrayItem,
}) => {
  const isArrayLong = valueLength > ARRAY_PREVIEW_COUNT;

  return (
    <div className="flex flex-col gap-1">
      <TypeChip text={`Array\u00B7${valueLength}`} className="w-fit" />
      {visibleItems.map((item) => {
        const canToggleItem = item.isStructured || item.isItemLong;
        const isItemExpanded = !!expandedArrayItems[item.index];

        return (
          <div key={item.index} className="flex flex-col gap-1">
            {canToggleItem ? (
              <button
                type="button"
                className="text-left rounded hover:bg-layer-2"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleArrayItem(item.index);
                }}
              >
                {isItemExpanded ? (
                  <pre className="p-2 bg-layer-0 border border-secondary rounded font-mono text-[11px] whitespace-pre-wrap break-words leading-normal">
                    {item.prettyText}
                  </pre>
                ) : (
                  <span
                    className={
                      item.isItemLong
                        ? 'line-clamp-2 cursor-pointer hover:text-accent-primary'
                        : 'cursor-pointer hover:text-accent-primary'
                    }
                  >
                    {item.compactText}
                  </span>
                )}
              </button>
            ) : (
              <span
                className={
                  !isArrayExpanded && item.isItemLong ? 'line-clamp-2 cursor-pointer hover:text-accent-primary' : ''
                }
              >
                {item.compactText}
              </span>
            )}
          </div>
        );
      })}
      {!isArrayExpanded && isArrayLong && (
        <span className="text-secondary cursor-pointer hover:text-accent-primary">
          ... and {valueLength - ARRAY_PREVIEW_COUNT} more
        </span>
      )}
    </div>
  );
};

export default AdaptiveArrayValueContent;
