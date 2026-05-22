'use client';

import { FC } from 'react';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconExclamationCircle } from '@tabler/icons-react';

import { ButtonsI18nKey, RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const PREVIEW_LENGTH = 200;

interface Props {
  text: string;
  raw: string | null;
  isFailed?: boolean;
  isLong: boolean;
  isExpanded: boolean;
  cellKey: string;
  onToggleExpand: (key: string) => void;
}

const CellValue: FC<Props> = ({ text, raw, isFailed, isLong, isExpanded, cellKey, onToggleExpand }) => {
  const t = useI18n();
  if (raw === null) {
    if (isFailed) {
      return (
        <DialTooltip tooltip={t(RunsI18nKey.MetricFailedText)}>
          <IconExclamationCircle size={14} className="text-error" />
        </DialTooltip>
      );
    }
    return <span className="dial-tiny-text text-secondary">—</span>;
  }

  const isJson = raw.includes('\n') || raw.length > 100;

  if (isLong && !isExpanded) {
    return (
      <div className="dial-tiny-text">
        <span className="whitespace-pre-wrap break-words">{raw.slice(0, PREVIEW_LENGTH)}...</span>
        <button onClick={() => onToggleExpand(cellKey)} className="ml-1 text-accent-primary hover:underline">
          {t(ButtonsI18nKey.ShowMore)}
        </button>
      </div>
    );
  }

  if (isJson || isLong) {
    return (
      <pre className="dial-tiny-text whitespace-pre-wrap break-words overflow-y-auto max-h-[180px] font-mono">
        {text}
      </pre>
    );
  }

  return <span className="dial-tiny-text">{text}</span>;
};

export default CellValue;
