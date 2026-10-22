'use client';

import { Switch } from '@epam/ai-dial-ui-kit';
import { useCallback, useState } from 'react';

import InputPopup from '@/src/components/Common/InputPopup/InputPopup';
import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import TokenizedModelsModal from './TokenizedModelsModal';

interface Props<T> {
  model: T;
  onChangeModel: (model: T) => void;
}
const TokenizerModelSwitch = <T extends { tokenizerModel?: string }>({ model, onChangeModel }: Props<T>) => {
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
      <Switch
        isOn={model.tokenizerModel != null}
        labelProps={{ label: t(EntityFieldsI18nKey.tokenizerModel) }}
        id="tokenizerModel"
        onChange={onSwitchTokenizerModel}
        disabled={isReadOnlyAdmin}
      />
      {model.tokenizerModel != null && (
        <div className="pl-[42px] w-[300px]">
          <InputPopup
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
          </InputPopup>
        </div>
      )}
    </div>
  );
};

export default TokenizerModelSwitch;
