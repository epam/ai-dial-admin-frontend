'use client';

import { FC, useCallback, useState } from 'react';

import { DialFormPopup, PopupSize } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';

import { createSavedQuery } from '@/src/app/[lang]/queries/actions';
import QueryProperties from '@/src/components/Analytics/Queries/Properties/QueryProperties';
import { QueryMetadataForm } from '@/src/components/Analytics/Queries/models';
import { toSavedQueryRequest } from '@/src/components/Analytics/QueryBuilder/utils/saved-query';
import { createInitialState } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { DEFAULT_SAVED_QUERY_RESULT_VIEW, DEFAULT_SAVED_QUERY_SCOPE } from '@/src/constants/analytics/queries';
import { ButtonsI18nKey, QueriesI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntity } from '@/src/models/analytics/entity';
import { SavedQuery } from '@/src/models/analytics/saved-query';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

interface Props {
  entities: AnalyticsEntity[];
  onClose: () => void;
}

const emptyForm = (): QueryMetadataForm => ({
  name: '',
  description: '',
  tag: '',
  scope: DEFAULT_SAVED_QUERY_SCOPE,
});

const CreateQuery: FC<Props> = ({ entities, onClose }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isValid } = useSaveValidationContext();

  const [form, setForm] = useState<QueryMetadataForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = useCallback(async () => {
    setIsSaving(true);
    const request = toSavedQueryRequest({
      name: form.name,
      description: form.description,
      tag: form.tag,
      scope: form.scope,
      state: { ...createInitialState(), entityName: entities[0]?.name ?? '' },
      resultView: DEFAULT_SAVED_QUERY_RESULT_VIEW,
    });

    const res = await createSavedQuery(request);
    setIsSaving(false);

    if (!res.success) {
      showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
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
  }, [form, entities, showNotification, t, onClose, router]);

  return (
    <DialFormPopup
      open
      header={t(QueriesI18nKey.CreateQuery)}
      portalId="CreateQueryModal"
      size={PopupSize.Md}
      submitLabel={t(ButtonsI18nKey.Create)}
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

export default CreateQuery;
