'use client';

import { FC } from 'react';

import { IconX } from '@tabler/icons-react';
import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import { SpotlightedRow } from './models';
import { formatFieldValue } from './utils';

interface Props {
  rows: SpotlightedRow[];
  onRemove: (fullKey: string) => void;
}

const FocusStrip: FC<Props> = ({ rows, onRemove }) => {
  const t = useI18n();
  if (rows.length === 0) return null;

  return (
    <div
      className="flex gap-2 px-3 py-1.5 border-b border-secondary overflow-x-auto shrink-0"
      role="list"
      aria-label={t(RunsI18nKey.SpotlightedFieldsLabel)}
    >
      {rows.map((row) => (
        <div
          key={row.fullKey}
          className="flex flex-col gap-0.5 bg-layer-2 rounded px-2 py-1 min-w-[140px] max-w-[220px] shrink-0"
        >
          <div className="flex items-center justify-between gap-1">
            <DialEllipsisTooltip text={row.label} className="dial-caption-text font-mono font-medium text-primary" />
            <button
              onClick={() => onRemove(row.fullKey)}
              className="text-secondary hover:text-primary shrink-0"
              title={t(RunsI18nKey.RemoveSpotlight)}
            >
              <IconX size={12} />
            </button>
          </div>
          {row.values.map((val, idx) => (
            <DialEllipsisTooltip key={idx} text={formatFieldValue(val.raw)} className="dial-caption-text text-secondary" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default FocusStrip;
