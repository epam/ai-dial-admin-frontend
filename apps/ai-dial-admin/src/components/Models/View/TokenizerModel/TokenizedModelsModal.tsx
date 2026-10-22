'use client';

import { useCallback, useEffect, useState } from 'react';

import { Popup } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';

import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import TokenizedModelsGrid from './TokenizedModelsGrid';

interface Props<T> {
  model: T;
  isModalOpen: boolean;
  onClose: () => void;
  onSelectModelId: (name: string) => void;
}

const TokenizedModelsModal = <T extends { tokenizerModel?: string }>({
  model,
  isModalOpen,
  onClose,
  onSelectModelId,
}: Props<T>) => {
  const t = useI18n();

  const [selectedModel, setSelectedModel] = useState(model.tokenizerModel);

  const onSelectModel = useCallback(
    (id: string) => {
      setSelectedModel(id);
    },
    [setSelectedModel],
  );

  const onApply = useCallback(() => {
    if (selectedModel) {
      onSelectModelId(selectedModel);
      onClose();
    }
  }, [onSelectModelId, onClose, selectedModel]);

  useEffect(() => {
    setSelectedModel(model.tokenizerModel);
  }, [model]);

  return (
    <Popup
      onClose={onClose}
      header={t(EntityFieldsI18nKey.tokenizerModel)}
      portalId="Model"
      open={isModalOpen}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Apply),
        isSubmitDisabled: !selectedModel,
        onCancel: onClose,
        onSubmit: onApply,
      })}
    >
      <div className="flex flex-col px-6 py-4 h-[400px]">
        <TokenizedModelsGrid selectedModel={selectedModel} onSelectModelId={onSelectModel} />
      </div>
    </Popup>
  );
};

export default TokenizedModelsModal;
