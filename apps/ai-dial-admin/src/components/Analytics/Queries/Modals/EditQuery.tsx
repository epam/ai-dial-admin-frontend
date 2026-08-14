'use client';

import { FC, useCallback, useState } from 'react';

import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';

import { updateSavedQuery } from '@/src/app/[lang]/queries/actions';
import QueryProperties from '@/src/components/Analytics/Queries/Properties/QueryProperties';
import { QueryMetadataForm } from '@/src/components/Analytics/Queries/models';
import { describeSavedQueryError } from '@/src/components/Analytics/QueryBuilder/utils/saved-query-error';
import { toMetadataUpdateRequest } from '@/src/components/Analytics/QueryBuilder/utils/saved-query';
import { ButtonsI18nKey, QueriesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { SavedQuery } from '@/src/models/analytics/saved-query';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';

interface Props {
  query: SavedQuery;
  onClose: () => void;
  onSaved?: (query: SavedQuery) => void;
}

const formFromQuery = (query: SavedQuery): QueryMetadataForm => ({
  name: query.name,
  description: query.description ?? '',
  tag: query.tag ?? '',
  scope: query.scope,
});

const EditQuery: FC<Props> = ({ query, onClose, onSaved }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isValid } = useSaveValidationContext();

  const [form, setForm] = useState<QueryMetadataForm>(() => formFromQuery(query));
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = useCallback(async () => {
    setIsSaving(true);
    const res = await updateSavedQuery(query.id, toMetadataUpdateRequest(query, form));
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

    showNotification(
      getSuccessNotification(
        getUpdateNotificationTitle(ApplicationRoute.AnalyticsQueries, t),
        getUpdateNotificationDescription(ApplicationRoute.AnalyticsQueries, query.id, t),
      ),
    );
    onClose();
    onSaved?.(res.response as SavedQuery);
    router.refresh();
  }, [form, query, showNotification, t, onClose, onSaved, router]);

  return (
    <DialFormPopup
      open
      header={t(QueriesI18nKey.EditQuery)}
      portalId="EditQueryModal"
      size={PopupSize.Md}
      submitLabel={t(ButtonsI18nKey.Save)}
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

export default EditQuery;
