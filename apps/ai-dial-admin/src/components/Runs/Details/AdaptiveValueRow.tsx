'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { parseValue } from '@/src/utils/evaluation/detail-panel';

interface Props {
  label: string;
  value: string;
}

const AdaptiveValueRow: FC<Props> = ({ label, value }) => {
  const t = useI18n();
  const [isExpanded, setIsExpanded] = useState(false);

  const parsed = useMemo(() => parseValue(value), [value]);

  const handleToggle = useCallback(() => {
    if (parsed.isLong) setIsExpanded((prev) => !prev);
  }, [parsed.isLong]);

  return (
    <div
      className="group grid grid-cols-[minmax(70px,140px)_1fr_auto] gap-x-3 py-[5px] border-b border-tertiary last:border-b-0 items-start text-xs hover:bg-layer-3 hover:-mx-2 hover:px-2 hover:rounded"
      onClick={handleToggle}
      role={parsed.isLong ? 'button' : undefined}
    >
      <span className="text-secondary break-words pt-px">{label}</span>
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
      <CopyButton buttonLabel={t(ButtonsI18nKey.Copy)} value={parsed.rawText} valueLabel={label} />
    </div>
  );
};

export default AdaptiveValueRow;
