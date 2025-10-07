import { FC, useCallback, useState } from 'react';
import { DialSwitch } from '@epam/ai-dial-ui-kit';

import InputModal from '@/src/components/Common/InputModal/InputModal';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModel } from '@/src/models/dial/model';
import { PopUpState } from '@/src/types/pop-up';
import TokenizedModelsModal from './TokenizedModelsModal';

interface Props {
  model: DialModel;
  onChangeModel: (model: DialModel) => void;
}
const TokenizerModelSwitch: FC<Props> = ({ model, onChangeModel }) => {
  const t = useI18n();
  const [modalState, setIsModalState] = useState(PopUpState.Closed);

  const onSwitchTokenizerModel = useCallback(
    (value: boolean) => {
      const clonedModel = { ...model };
      if (!value) {
        delete clonedModel.tokenizerModel;
      } else {
        clonedModel.tokenizerModel = '';
      }
      onChangeModel(clonedModel);
    },
    [onChangeModel, model],
  );

  const onSelectModelId = useCallback(
    (tokenizerModel: string) => {
      if (tokenizerModel) {
        onChangeModel({ ...model, tokenizerModel });
      }
    },
    [onChangeModel, model],
  );

  const onOpenModal = useCallback(() => {
    setIsModalState(PopUpState.Opened);
  }, [setIsModalState]);

  const onCloseModal = useCallback(() => {
    setIsModalState(PopUpState.Closed);
  }, [setIsModalState]);

  return (
    <div className="flex flex-col gap-3">
      <DialSwitch
        isOn={model.tokenizerModel != null}
        title={t(EntityFieldsI18nKey.tokenizerModel)}
        switchId="tokenizerModel"
        onChange={onSwitchTokenizerModel}
      />
      {model.tokenizerModel != null && (
        <div className="pl-[42px] lg:w-[35%]">
          <InputModal modalState={modalState} selectedValue={model.tokenizerModel} onOpenModal={onOpenModal}>
            <TokenizedModelsModal
              model={model}
              onSelectModelId={onSelectModelId}
              modalState={modalState}
              onClose={onCloseModal}
            />
          </InputModal>
        </div>
      )}
    </div>
  );
};

export default TokenizerModelSwitch;
