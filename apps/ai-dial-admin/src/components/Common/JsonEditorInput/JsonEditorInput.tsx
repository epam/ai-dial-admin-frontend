import { DialFormPopup, DialInputPopup, DialLabel } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { BasicI18nKey, ButtonsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { JSONEditorError } from '@/src/types/editor';

interface Props {
  value: object;
  label?: string;
  elementId?: string;
  disabled?: boolean;
  inputClassName?: string;
  onChangeValue: (json: object) => void;
  disableValidation?: boolean;
}

const JsonEditorInput: FC<Props> = ({
  value,
  disabled,
  label,
  elementId,
  inputClassName,
  onChangeValue,
  disableValidation,
}) => {
  const t = useI18n();
  const [isValid, setIsValid] = useState(false);
  const [jsonValue, setJsonValue] = useState<string | undefined>(undefined);
  const [isValidJSON, setIsValidJSON] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

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
    <div className="flex flex-col gap-y-2">
      {label && <DialLabel label={label} htmlFor={elementId} />}
      <DialInputPopup
        disabled={disabled}
        open={isModalOpen}
        selectedValue={jsonValue}
        onOpen={onOpenModal}
        emptyValueText={t(BasicI18nKey.NoData)}
        inputClassName={inputClassName}
      >
        <DialFormPopup
          onClose={onCloseModal}
          header={t(EntityPlaceholdersI18nKey.Object)}
          portalId="jsonInputModal"
          open={isModalOpen}
          submitLabel={t(ButtonsI18nKey.Apply)}
          onSubmit={onApply}
          cancelLabel={t(ButtonsI18nKey.Cancel)}
          onCancel={onCloseModal}
          disableSubmitButton={!isValid && !disableValidation}
        >
          <div className="px-6 py-4 h-[540px] max-h-[35vh]">
            <JsonEditorBase value={jsonValue} onChange={onChangeJsonValue} onValidateJSON={onValidateJSON} />
          </div>
        </DialFormPopup>
      </DialInputPopup>
    </div>
  );
};

export default JsonEditorInput;
