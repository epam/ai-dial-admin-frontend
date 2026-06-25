'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import { DialFormPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel } from '@/src/models/dial/model';
import TokenizedModelsGrid from './TokenizedModelsGrid';

interface Props {
  model: DialModel;
  isModalOpen: boolean;
  onClose: () => void;
  onSelectModelId: (name: string) => void;
}

const TokenizedModelsModal: FC<Props> = ({ model, isModalOpen, onClose, onSelectModelId }) => {
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
    <DialFormPopup
      onClose={onClose}
      header={t(EntityFieldsI18nKey.tokenizerModel)}
      portalId="Model"
      open={isModalOpen}
      onSubmit={onApply}
      onCancel={onClose}
      disableSubmitButton={!selectedModel}
      submitLabel={t(ButtonsI18nKey.Apply)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
    >
      <div className="flex flex-col px-6 py-4 h-[400px]">
        <TokenizedModelsGrid selectedModel={selectedModel} onSelectModelId={onSelectModel} />
      </div>
    </DialFormPopup>
  );
};

export default TokenizedModelsModal;
