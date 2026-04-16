'use client';

import { FC } from 'react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const PREVIEW_LENGTH = 200;

interface Props {
  text: string;
  raw: string | null;
  isLong: boolean;
  isExpanded: boolean;
  cellKey: string;
  onToggleExpand: (key: string) => void;
}

const CellValue: FC<Props> = ({ text, raw, isLong, isExpanded, cellKey, onToggleExpand }) => {
  const t = useI18n();
  if (raw === null) {
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
