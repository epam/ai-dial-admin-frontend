'use client';

import { FC } from 'react';

import TypeChip from './AdaptiveValueTypeChip';
import { StructuredObjectValue } from './types';

interface StructuredValueContentProps {
  structuredValue: StructuredObjectValue;
  isExpanded: boolean;
}

const AdaptiveStructuredValueContent: FC<StructuredValueContentProps> = ({ structuredValue, isExpanded }) => (
  <>
    <TypeChip text={structuredValue.typeChip} />
    {!isExpanded && (
      <span className={structuredValue.isLong ? 'line-clamp-2 cursor-pointer hover:text-accent-primary' : ''}>
        {structuredValue.displayText}
      </span>
    )}
    {isExpanded && (
      <pre className="mt-1 p-2 bg-layer-0 border border-secondary rounded font-mono text-[11px] whitespace-pre-wrap break-words max-h-[300px] overflow-auto leading-normal">
        {structuredValue.rawText}
      </pre>
    )}
  </>
);

export default AdaptiveStructuredValueContent;
