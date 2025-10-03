import { FC, useCallback, useEffect, useState } from 'react';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import Field from '@/src/components/Common/Field/Field';
import InputModal from '@/src/components/Common/InputModal/InputModal';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { JSONEditorError } from '@/src/types/editor';
import { PopUpState } from '@/src/types/pop-up';

interface Props {
  value: object;
  fieldTitle?: string;
  elementId?: string;
  disabled?: boolean;
  onChangeValue: (json: object) => void;
}

const JsonEditorInput: FC<Props> = ({ value, disabled, fieldTitle, elementId, onChangeValue }) => {
  const t = useI18n();
  const [isValid, setIsValid] = useState(false);
  const [jsonValue, setJsonValue] = useState<string | undefined>(undefined);
  const [isValidJSON, setIsValidJSON] = useState(false);

  const [modalState, setModalState] = useState(PopUpState.Closed);

  const onOpenModal = useCallback(() => {
    setModalState(PopUpState.Opened);
  }, [setModalState]);

  const onCloseModal = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, [setModalState]);

  useEffect(() => {
    try {
      setJsonValue(JSON.stringify(value, null, 2));
    } catch {
      console.error('Invalid JSON');
    }
  }, [value]);

  useEffect(() => {
    setIsValid(Boolean(jsonValue) && isValidJSON);
  }, [jsonValue, isValidJSON]);

  const onChangeJsonValue = useCallback((v: string | undefined) => {
    setIsValidJSON(true);
    setJsonValue(v);
  }, []);

  const onValidateJSON = useCallback(
    (errors?: JSONEditorError[]) => {
      setIsValidJSON(!errors?.length);
    },
    [setIsValidJSON],
  );

  const onApply = useCallback(() => {
    onChangeValue(JSON.parse(jsonValue as string));
    onCloseModal();
  }, [onChangeValue, jsonValue, onCloseModal]);

  return (
    <div className="flex flex-col">
      <Field fieldTitle={fieldTitle} htmlFor={elementId} />
      <InputModal readonly={disabled} modalState={modalState} selectedValue={jsonValue} onOpenModal={onOpenModal}>
        <Popup
          onClose={onCloseModal}
          heading={t(EntityPlaceholdersI18nKey.Object)}
          portalId={'jsonInputModal'}
          state={modalState}
        >
          <div className="px-6 py-4">
            <div className="h-[540px] max-h-[35vh]">
              <JsonEditorBase value={jsonValue} onChange={onChangeJsonValue} onValidateJSON={onValidateJSON} />
            </div>
          </div>
          <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
            <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onCloseModal} />
            <DialButton
              variant={ButtonVariant.Primary}
              title={t(ButtonsI18nKey.Apply)}
              onClick={onApply}
              disable={!isValid}
            />
          </div>
        </Popup>
      </InputModal>
    </div>
  );
};

export default JsonEditorInput;
