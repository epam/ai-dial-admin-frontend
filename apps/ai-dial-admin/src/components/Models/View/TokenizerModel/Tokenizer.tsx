import { FC, useCallback, useState } from 'react';
import { DialInputPopup, DialSwitch } from '@epam/ai-dial-ui-kit';

import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialModel } from '@/src/models/dial/model';
import TokenizedModelsModal from './TokenizedModelsModal';

interface Props {
  model: DialModel;
  onChangeModel: (model: DialModel) => void;
}
const TokenizerModelSwitch: FC<Props> = ({ model, onChangeModel }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  return (
    <div className="flex flex-col gap-3">
      <DialSwitch
        isOn={model.tokenizerModel != null}
        label={t(EntityFieldsI18nKey.tokenizerModel)}
        switchId="tokenizerModel"
        onChange={onSwitchTokenizerModel}
        disabled={isReadOnlyAdmin}
      />
      {model.tokenizerModel != null && (
        <div className="pl-[42px] w-[300px]">
          <DialInputPopup
            open={isModalOpen}
            selectedValue={model.tokenizerModel}
            onOpen={onOpenModal}
            emptyValueText={t(EntitiesI18nKey.NoModels)}
            disabled={isReadOnlyAdmin}
          >
            <TokenizedModelsModal
              model={model}
              onSelectModelId={onSelectModelId}
              isModalOpen={isModalOpen}
              onClose={onCloseModal}
            />
          </DialInputPopup>
        </div>
      )}
    </div>
  );
};

export default TokenizerModelSwitch;
