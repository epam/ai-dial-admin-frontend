'use client';

import { FC } from 'react';

import { ParsedValue } from '@/src/models/evaluation/detail-panel';
import TypeChip from './AdaptiveValueTypeChip';

interface PrimitiveValueContentProps {
  parsed: ParsedValue | null;
  isExpanded: boolean;
  primitiveValue: string;
}

const AdaptivePrimitiveValueContent: FC<PrimitiveValueContentProps> = ({ parsed, isExpanded, primitiveValue }) => (
  <>
    {parsed?.typeChip && <TypeChip text={parsed.typeChip} />}
    {!isExpanded && (
      <span className={parsed?.isLong ? 'line-clamp-2 cursor-pointer hover:text-accent-primary' : ''}>
        {parsed?.displayText}
      </span>
    )}
    {isExpanded && (
      <pre className="mt-1 p-2 bg-layer-0 border border-secondary rounded font-mono text-[11px] whitespace-pre-wrap break-words max-h-[300px] overflow-auto leading-normal">
        {parsed?.rawText ?? primitiveValue}
      </pre>
    )}
    {!parsed && !isExpanded && (
      <span className={primitiveValue.length > 100 ? 'line-clamp-2 cursor-pointer hover:text-accent-primary' : ''}>
        {primitiveValue}
      </span>
    )}
  </>
);

export default AdaptivePrimitiveValueContent;
