'use client';

import { FC, useCallback, useState } from 'react';

import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';

import { createSavedQuery } from '@/src/app/[lang]/queries/actions';
import QueryProperties from '@/src/components/Analytics/Queries/Properties/QueryProperties';
import { QueryMetadataForm } from '@/src/components/Analytics/Queries/models';
import { toMetadataReplaceRequest } from '@/src/components/Analytics/QueryBuilder/utils/saved-query';
import { describeSavedQueryError } from '@/src/components/Analytics/QueryBuilder/utils/saved-query-error';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { getCloneTitle } from '@/src/utils/entities/duplicate-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

interface Props {
  query: SavedQuery;
  onClose: () => void;
}

// Deliberately not the shared `getClonedEntityName`, which returns the name untouched once it contains
// "copy" anywhere. The other duplicate flows tolerate that because they pre-check uniqueness before
// submitting; this one cannot — the service enforces none — so duplicating a copy would pre-fill the
// identical name and an unedited submit would quietly create a second query under it. The substring test
// also misfires on prose names ("chat copywriting stats"), which entity identifiers never look like.
const copiedName = (name: string): string => `${name} (copy)`;

const formFromQuery = (query: SavedQuery, isFullAdmin: boolean): QueryMetadataForm => ({
  name: copiedName(query.name),
  description: query.description ?? '',
  tag: query.tag ?? '',
  // The copy has to be one its creator can write. Only a full administrator may write the common scope,
  // so for anyone else the copy of a common query lands in their personal scope instead of failing on save.
  scope: isFullAdmin ? query.scope : SavedQueryScope.Personal,
});

const DuplicateQuery: FC<Props> = ({ query, onClose }) => {
  const t = useI18n();
  const router = useRouter();
  const { isFullAdmin } = useAppContext();
  const { showNotification } = useNotification();
  const { isValid } = useSaveValidationContext();

  const [form, setForm] = useState<QueryMetadataForm>(() => formFromQuery(query, isFullAdmin));
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = useCallback(async () => {
    setIsSaving(true);
    // The service places no uniqueness constraint on a name, so the copy goes straight out without a
    // pre-flight check against the existing list.
    const res = await createSavedQuery(toMetadataReplaceRequest(query, form));
    setIsSaving(false);

    if (!res.success) {
      const descriptor = describeSavedQueryError(res);
      showNotification(
        getErrorNotification(
          res.errorHeader,
          descriptor.isServerMessageShown ? res.errorMessage : t(descriptor.hintKey),
          res.requestId,
        ),
      );
      return;
    }

    const created = res.response as SavedQuery;
    showNotification(
      getSuccessNotification(
        getCreateNotificationTitle(ApplicationRoute.AnalyticsQueries, t),
        getCreateNotificationDescription(ApplicationRoute.AnalyticsQueries, created.id, t),
      ),
    );
    onClose();
    router.push(getUrnForEntity(ApplicationRoute.AnalyticsQueries, created));
  }, [form, query, showNotification, t, onClose, router]);

  return (
    <DialFormPopup
      open
      header={getCloneTitle(ApplicationRoute.AnalyticsQueries, t)}
      portalId="DuplicateQueryModal"
      size={PopupSize.Md}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      disableSubmitButton={!isValid || !form.name.trim() || isSaving}
      onSubmit={onSubmit}
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="flex flex-col gap-y-6 px-6 py-4">
        <QueryProperties form={form} onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))} isModal />
      </div>
    </DialFormPopup>
  );
};

export default DuplicateQuery;
