'use client';

import { FC, useState } from 'react';

import {
  DialDangerButton,
  DialNeutralButton,
  DialPopup,
  DialPrimaryButton,
  DialTabs,
  PopupSize,
} from '@epam/ai-dial-ui-kit';

import SavedQueryList from '@/src/components/Analytics/QueryBuilder/SavedQueries/SavedQueryList';
import SavedQueryPreview from '@/src/components/Analytics/QueryBuilder/SavedQueries/SavedQueryPreview';
import { SAVED_QUERIES_DIALOG_HEIGHT, SAVED_QUERIES_LIST_WIDTH } from '@/src/constants/analytics/saved-queries';
import { ButtonsI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';

interface Props {
  open: boolean;
  queriesFor: (scope: SavedQueryScope) => SavedQuery[];
  onLoadScope: (scope: SavedQueryScope) => void;
  // True only when a loaded saved query has diverged — a scratch query has nothing to discard.
  hasUnsavedChanges: boolean;
  onOpenQuery: (query: SavedQuery) => void;
  onDeleteQuery: (query: SavedQuery) => void;
  onClose: () => void;
}

const SavedQueriesDialog: FC<Props> = ({
  open,
  queriesFor,
  onLoadScope,
  hasUnsavedChanges,
  onOpenQuery,
  onDeleteQuery,
  onClose,
}) => {
  const t = useI18n();
  const { isEnableAuth, isFullAdmin } = useAppContext();

  const [scope, setScope] = useState<SavedQueryScope>(SavedQueryScope.Personal);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SavedQuery | null>(null);
  const [confirming, setConfirming] = useState<SavedQuery | null>(null);
  const [deleting, setDeleting] = useState<SavedQuery | null>(null);

  const queries = queriesFor(scope);

  // Personal rows are server-filtered to the caller, so anything visible there is theirs to delete;
  // writing `common` needs FULL_ADMIN.
  const canDelete = scope === SavedQueryScope.Personal || isFullAdmin;

  const onChangeScope = (next: SavedQueryScope) => {
    setScope(next);
    setSelected(null);
    setConfirming(null);
    setDeleting(null);
    onLoadScope(next);
  };

  // Opening replaces the builder, the rail and the results, so unsaved work is confirmed first —
  // in this dialog's own footer rather than a second modal stacked on top of it.
  const requestOpen = (query: SavedQuery) => {
    if (hasUnsavedChanges) {
      setSelected(query);
      setConfirming(query);
      return;
    }
    onOpenQuery(query);
  };

  const tabs = [
    { id: SavedQueryScope.Personal, label: t(QueryBuilderI18nKey.SavedQueriesMy) },
    { id: SavedQueryScope.Common, label: t(QueryBuilderI18nKey.SavedQueriesCommon) },
  ];

  const footerNote =
    scope === SavedQueryScope.Personal
      ? // Claiming privacy on a service with authentication switched off would be a lie.
        isEnableAuth
        ? t(QueryBuilderI18nKey.SavedQueriesFooterPersonal, { count: queries.length })
        : ''
      : t(QueryBuilderI18nKey.SavedQueriesFooterCommon, { count: queries.length });

  const footer = (
    <div className="flex w-full items-center gap-3 px-6 py-4">
      {deleting ? (
        // Same reasoning as the discard confirmation: this dialog confirms in its own footer rather
        // than stacking a popup with a second focus trap over itself.
        <>
          <span className="min-w-0 flex-1 text-error dial-tiny-text">
            {t(QueryBuilderI18nKey.SavedQueryDeleteDescription, { name: deleting.name })}
          </span>
          <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={() => setDeleting(null)} />
          <DialDangerButton
            label={t(ButtonsI18nKey.Delete)}
            onClick={() => {
              const query = deleting;
              setDeleting(null);
              if (selected?.id === query.id) setSelected(null);
              onDeleteQuery(query);
            }}
          />
        </>
      ) : confirming ? (
        <>
          <span className="min-w-0 flex-1 text-warning dial-tiny-text">
            {t(QueryBuilderI18nKey.SavedQueryDiscardPrompt)}
          </span>
          <DialNeutralButton label={t(QueryBuilderI18nKey.SavedQueryKeepEditing)} onClick={() => setConfirming(null)} />
          <DialPrimaryButton
            label={t(QueryBuilderI18nKey.SavedQueryDiscardAndOpen)}
            onClick={() => {
              const query = confirming;
              setConfirming(null);
              onOpenQuery(query);
            }}
          />
        </>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate text-secondary dial-tiny-text">{footerNote}</span>
          <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
          <DialPrimaryButton
            label={t(QueryBuilderI18nKey.SavedQueriesOpen)}
            disabled={!selected}
            onClick={() => selected && requestOpen(selected)}
          />
        </>
      )}
    </div>
  );

  // The width is a literal Tailwind class rather than a constant: arbitrary values are only generated
  // for text Tailwind can see statically, so an interpolated one would silently produce no CSS.
  return (
    <DialPopup
      open={open}
      header={t(QueryBuilderI18nKey.SavedQueries)}
      size={PopupSize.Lg}
      className="w-[960px] max-w-[95vw]"
      portalId="SavedQueriesDialog"
      footer={footer}
      onClose={onClose}
    >
      {/* The popup's own body scrolls (`flex-1 size-full overflow-y-auto`), which would carry the tabs
          out of view. Capping at 100% keeps this content inside the body so that scroll never engages,
          leaving the list and the preview to scroll independently. */}
      <div className="flex flex-col overflow-hidden" style={{ height: SAVED_QUERIES_DIALOG_HEIGHT, maxHeight: '100%' }}>
        <div className="shrink-0 px-6 pt-2">
          <DialTabs tabs={tabs} activeTab={scope} onClick={(id) => onChangeScope(id as SavedQueryScope)} />
        </div>
        <div
          className="grid min-h-0 flex-1 overflow-hidden"
          style={{ gridTemplateColumns: `${SAVED_QUERIES_LIST_WIDTH}px 1fr` }}
        >
          <div className="flex min-h-0 flex-col overflow-hidden border-r border-primary">
            <SavedQueryList
              queries={queries}
              scope={scope}
              search={search}
              onChangeSearch={setSearch}
              selectedId={selected?.id}
              canDelete={canDelete}
              onSelect={setSelected}
              onOpen={requestOpen}
              onDelete={setDeleting}
            />
          </div>
          <div className="flex min-h-0 flex-col overflow-hidden">
            <SavedQueryPreview query={selected} />
          </div>
        </div>
      </div>
    </DialPopup>
  );
};

export default SavedQueriesDialog;
