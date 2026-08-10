'use client';

import { FC } from 'react';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconArrowBackUp, IconBookmark, IconDeviceFloppy, IconPencil, IconTrashX } from '@tabler/icons-react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ButtonsI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  // False while nothing is loaded: Revert, Edit and Delete all act on a saved query, so they have
  // nothing to act on and are not rendered.
  hasLoadedQuery: boolean;
  saveDisabled: boolean;
  // Only a diverged query has anything to revert to.
  revertDisabled: boolean;
  onOpenLibrary: () => void;
  onSave: () => void;
  onRevert: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const SavedQueriesActions: FC<Props> = ({
  hasLoadedQuery,
  saveDisabled,
  revertDisabled,
  onOpenLibrary,
  onSave,
  onRevert,
  onEdit,
  onDelete,
}) => {
  const t = useI18n();

  // A fragment rather than a wrapper: these sit directly in the toolbar's own flex row, so they take
  // its spacing and stay evenly spaced with Copy and Run instead of forming a tighter sub-group.
  return (
    <>
      <DialNeutralButton
        label={t(QueryBuilderI18nKey.SavedQueries)}
        iconBefore={<IconBookmark {...BASE_BUTTON_ICON_PROPS} />}
        onClick={onOpenLibrary}
      />

      <DialNeutralButton
        label={t(QueryBuilderI18nKey.SaveQuery)}
        iconBefore={<IconDeviceFloppy {...BASE_BUTTON_ICON_PROPS} />}
        disabled={saveDisabled}
        onClick={onSave}
      />

      {hasLoadedQuery && (
        <>
          <DialNeutralButton
            label={t(QueryBuilderI18nKey.SavedQueryRevert)}
            iconBefore={<IconArrowBackUp {...BASE_BUTTON_ICON_PROPS} />}
            disabled={revertDisabled}
            onClick={onRevert}
          />

          <DialNeutralButton
            label={t(ButtonsI18nKey.Edit)}
            iconBefore={<IconPencil {...BASE_BUTTON_ICON_PROPS} />}
            onClick={onEdit}
          />

          {/* Neutral like its neighbours so the toolbar stays calm; only the icon carries the warning,
              and the action still confirms before anything is removed. */}
          <DialNeutralButton
            label={t(ButtonsI18nKey.Delete)}
            iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} className="text-error" />}
            onClick={onDelete}
          />
        </>
      )}
    </>
  );
};

export default SavedQueriesActions;
