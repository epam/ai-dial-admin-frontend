'use client';

import { FC, useCallback, useState } from 'react';

import { DialFormPopup, DialInput, DialTextarea, PopupSize } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, EntityFieldsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  isOpen: boolean;
  testCaseCount: number;
  onClose: () => void;
  onConfirm: (displayName: string, description?: string) => void;
}

const PublishDatasetModal: FC<Props> = ({ isOpen, testCaseCount, onClose, onConfirm }) => {
  const t = useI18n();
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');

  const onCreateClick = useCallback(() => {
    onConfirm(displayName, description || undefined);
  }, [displayName, description, onConfirm]);

  const onCloseModal = useCallback(() => {
    setDisplayName('');
    setDescription('');
    onClose();
  }, [onClose]);

  return (
    <DialFormPopup
      onClose={onCloseModal}
      header={t(TestSuitesI18nKey.PublishToDataset)}
      portalId="PublishDatasetModal"
      open={isOpen}
      onSubmit={onCreateClick}
      onCancel={onCloseModal}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Create)}
      disableSubmitButton={!displayName.trim()}
      size={PopupSize.Sm}
    >
      <div className="flex flex-col gap-4 py-4 px-6">
        <p className="dial-small text-secondary">
          {t(TestSuitesI18nKey.PublishToDatasetCountText, { count: testCaseCount })}
        </p>
        <DialInput
          labelProps={{ label: t(EntityFieldsI18nKey.displayName) }}
          value={displayName}
          onChange={(value) => setDisplayName(value ?? '')}
          id="publish-display-name"
        />
        <DialTextarea
          labelProps={{ label: t(EntityFieldsI18nKey.description) }}
          value={description}
          onChange={(value) => setDescription(value ?? '')}
          id="publish-description"
        />
      </div>
    </DialFormPopup>
  );
};

export default PublishDatasetModal;
