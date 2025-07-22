import { FC, useCallback, useEffect, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, ModelViewI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel } from '@/src/models/dial/model';
import { PopUpState } from '@/src/types/pop-up';
import TokenizedModelsGrid from './TokenizedModelsGrid';

interface Props {
  model: DialModel;
  modalState: PopUpState;
  onClose: () => void;
  onSelectModelId: (name: string) => void;
}

const TokenizedModelsModal: FC<Props> = ({ model, modalState, onClose, onSelectModelId }) => {
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
    <Popup onClose={onClose} heading={t(ModelViewI18nKey.TokenizerModel)} portalId="Model" state={modalState}>
      <div className="flex flex-col px-6 py-4 h-[400px]">
        <TokenizedModelsGrid selectedModel={selectedModel} onSelectModelId={onSelectModel} />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button cssClass="primary" title={t(ButtonsI18nKey.Apply)} onClick={onApply} disable={!selectedModel} />
      </div>
    </Popup>
  );
};

export default TokenizedModelsModal;
