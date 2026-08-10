'use client';

import { FC } from 'react';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { IconX } from '@tabler/icons-react';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SavedQuery } from '@/src/models/analytics/saved-query';

interface Props {
  query: SavedQuery;
  isDirty: boolean;
  onClose: () => void;
}

// Without this the screen cannot answer "am I editing something that has a name?".
const LoadedQueryChip: FC<Props> = ({ query, isDirty, onClose }) => {
  const t = useI18n();

  return (
    <span className="inline-flex max-w-[420px] items-center gap-2 rounded border border-primary bg-layer-3 py-1 pl-2.5 pr-1.5 dial-tiny-text text-secondary">
      {isDirty && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-warning" />}
      <DialEllipsisTooltip text={query.name} className="min-w-0 truncate text-primary dial-tiny-semi-text" />
      {!!query.tag && (
        <>
          <span aria-hidden className="shrink-0 text-controls-disable">
            ·
          </span>
          <span className="shrink-0 truncate">{query.tag}</span>
        </>
      )}
      {/* Detaches the builder from this saved query without touching what is on screen — the work
          stays, it just stops being tracked as that query. */}
      <button
        type="button"
        aria-label={`${t(ButtonsI18nKey.Close)} ${query.name}`}
        className="shrink-0 rounded p-0.5 text-secondary hover:bg-layer-4 hover:text-primary"
        onClick={onClose}
      >
        <IconX size={14} />
      </button>
    </span>
  );
};

export default LoadedQueryChip;
