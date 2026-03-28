'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { IconCopy } from '@tabler/icons-react';

import { BasicI18nKey, ButtonsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getSuccessNotification } from '@/src/utils/notification';

interface Props {
  label: string;
  value: string;
}

interface ParsedValue {
  displayText: string;
  rawText: string;
  typeChip?: string;
  isLong: boolean;
}

const parseValue = (value: string): ParsedValue => {
  const raw = value;

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      const preview = parsed.length > 0 ? JSON.stringify(parsed[0]).slice(0, 120) : '';
      return {
        displayText: preview ? `${preview}...` : '[]',
        rawText: JSON.stringify(parsed, null, 2),
        typeChip: `Array\u00B7${parsed.length}`,
        isLong: true,
      };
    }
    if (typeof parsed === 'object' && parsed !== null) {
      const keys = Object.keys(parsed);
      return {
        displayText: JSON.stringify(parsed).slice(0, 120) + '...',
        rawText: JSON.stringify(parsed, null, 2),
        typeChip: `Object`,
        isLong: true,
      };
    }
  } catch {
    // Not JSON — treat as plain string
  }

  return {
    displayText: raw,
    rawText: raw,
    isLong: raw.length > 100,
  };
};

const AdaptiveValueRow: FC<Props> = ({ label, value }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [isExpanded, setIsExpanded] = useState(false);

  const parsed = useMemo(() => parseValue(value), [value]);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(parsed.rawText);
      showNotification(getSuccessNotification(`${t(RunsI18nKey.CopyValue)} ${t(BasicI18nKey.CopiedSuccessfully)}`));
    },
    [parsed.rawText, showNotification, t],
  );

  const handleToggle = useCallback(() => {
    if (parsed.isLong) setIsExpanded((prev) => !prev);
  }, [parsed.isLong]);

  return (
    <div
      className="group grid grid-cols-[minmax(70px,auto)_1fr_auto] gap-x-3 py-[5px] border-b border-tertiary last:border-b-0 items-start text-xs hover:bg-layer-3 hover:-mx-2 hover:px-2 hover:rounded"
      onClick={handleToggle}
      role={parsed.isLong ? 'button' : undefined}
    >
      <span className="text-secondary whitespace-nowrap pt-px">{label}</span>
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
          <pre className="mt-1 p-2 bg-layer-0 border border-secondary rounded font-mono text-[11px] whitespace-pre-wrap break-words max-h-[300px] overflow-auto leading-[1.5]">
            {parsed.rawText}
          </pre>
        )}
      </span>
      <button
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-secondary hover:text-accent-primary shrink-0"
        onClick={handleCopy}
        title={t(ButtonsI18nKey.Copy)}
      >
        <IconCopy size={14} />
      </button>
    </div>
  );
};

export default AdaptiveValueRow;
