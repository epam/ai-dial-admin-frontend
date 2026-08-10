'use client';

import { FC } from 'react';

import classNames from 'classnames';
import { DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import { useSavedQueryLabels } from '@/src/components/Analytics/QueryBuilder/SavedQueries/use-saved-query-labels';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SavedQuery } from '@/src/models/analytics/saved-query';

interface Props {
  query: SavedQuery;
  selected: boolean;
  // False for a `common` row the caller may not write — the service would answer 403, so the action
  // is not offered rather than shown and then rejected.
  canDelete: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onDelete: () => void;
}

const SavedQueryRow: FC<Props> = ({ query, selected, canDelete, onSelect, onOpen, onDelete }) => {
  const t = useI18n();
  const { periodLabel } = useSavedQueryLabels();

  const meta = [query.source, periodLabel(query.time)].filter(Boolean).join(' · ');

  return (
    // The delete control is a sibling of the row button rather than nested inside it: a button within
    // a button is invalid markup and unreachable by keyboard.
    <div
      className={classNames(
        'group flex items-start gap-1 rounded border pr-1',
        selected ? 'border-accent-primary bg-accent-primary-alpha' : 'border-transparent hover:bg-layer-4',
      )}
    >
      <button
        type="button"
        aria-current={selected}
        className="flex min-w-0 flex-1 items-start gap-2.5 p-2 text-left"
        onClick={onSelect}
        onDoubleClick={onOpen}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-primary dial-small-text">{query.name}</span>
          {!!meta && <span className="block truncate text-secondary dial-tiny-text">{meta}</span>}
        </span>
      </button>

      {canDelete && (
        <DialGhostIconButton
          size={ElementSize.Small}
          aria-label={`${t(ButtonsI18nKey.Delete)} ${query.name}`}
          // Kept out of the way until the row is hovered or focused, so the list stays scannable —
          // focus-visible keeps it reachable without a mouse.
          className="mt-1.5 shrink-0 opacity-0 focus-within:opacity-100 group-hover:opacity-100"
          icon={<IconTrashX size={16} className="text-error" />}
          onClick={onDelete}
        />
      )}
    </div>
  );
};

export default SavedQueryRow;
