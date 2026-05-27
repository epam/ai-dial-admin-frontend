'use client';

import { FC, useCallback, useState } from 'react';

import { DialFormPopup, DialInput, DialTextarea, PopupSize } from '@epam/ai-dial-ui-kit';

import { createDataset } from '@/src/app/[lang]/datasets/actions';
import { ButtonsI18nKey, DatasetsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { Dataset } from '@/src/models/evaluation/dataset';
import { DatasetVisibility } from '@/src/types/evaluation';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  isModalOpen: boolean;
  visibility: DatasetVisibility;
  bindToSuiteId?: string;
  onClose: () => void;
  onCreated: (dataset: Dataset) => void;
}

const CreateDatasetModal: FC<Props> = ({ isModalOpen, visibility, bindToSuiteId, onClose, onCreated }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = useCallback(() => {
    if (!name.trim()) return;
    setSubmitting(true);
    createDataset({
      name: name.trim(),
      description: description.trim() || undefined,
      testCaseSchema: [],
      visibility,
      bindToSuiteId: visibility === DatasetVisibility.PRIVATE ? bindToSuiteId : undefined,
    })
      .then((res) => {
        if (res?.success && res.response) {
          onCreated(res.response as Dataset);
          onClose();
        } else {
          showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage));
        }
      })
      .finally(() => setSubmitting(false));
  }, [name, description, visibility, bindToSuiteId, onClose, onCreated, showNotification]);

  return (
    <DialFormPopup
      open={isModalOpen}
      header={t(DatasetsI18nKey.CreateDataset)}
      portalId="CreateDataset"
      size={PopupSize.Md}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Create)}
      onClose={onClose}
      onCancel={onClose}
      onSubmit={onSubmit}
      disableSubmitButton={!name.trim() || submitting}
    >
      <div className="flex flex-col gap-4 px-6 py-4">
        <DialInput
          id="dataset-name"
          labelProps={{ label: 'Name', required: true }}
          value={name}
          onChange={(v) => setName(v ?? '')}
        />
        <DialTextarea
          id="dataset-description"
          labelProps={{ label: 'Description' }}
          value={description}
          onChange={(v) => setDescription(v ?? '')}
        />
      </div>
    </DialFormPopup>
  );
};

export default CreateDatasetModal;
