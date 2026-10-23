import { ErrorText, Label, Popup } from '@epam/ai-dial-ui-kit';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import InputPopup from '@/src/components/Common/InputPopup/InputPopup';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { BasicI18nKey, ButtonsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
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
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [isValid, setIsValid] = useState(false);
  const [jsonValue, setJsonValue] = useState<string | undefined>(undefined);
  const [isValidJSON, setIsValidJSON] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const committedJsonValue = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      console.error('Invalid JSON');
      return undefined;
    }
  }, [value]);

  const resetDraftFromCommitted = useCallback(() => {
    setJsonValue(committedJsonValue);
    setIsValidJSON(true);
  }, [committedJsonValue]);

  const onOpenModal = useCallback(() => {
    resetDraftFromCommitted();
    setIsModalOpen(true);
  }, [resetDraftFromCommitted]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const onCancelModal = useCallback(() => {
    resetDraftFromCommitted();
    setParseError(null);
    onCloseModal();
  }, [resetDraftFromCommitted, onCloseModal]);

  useEffect(() => {
    setIsValid(Boolean(jsonValue) && isValidJSON);
  }, [jsonValue, isValidJSON]);

  const onChangeJsonValue = useCallback((v: string | undefined) => {
    setIsValidJSON(true);
    setParseError(null);
    setJsonValue(v);
  }, []);

  const onValidateJSON = useCallback(
    (errors?: JSONEditorError[]) => {
      setIsValidJSON(!errors?.length);
    },
    [setIsValidJSON],
  );

  const onApply = useCallback(() => {
    let parsed;
    try {
      parsed = JSON.parse(jsonValue as string);
    } catch {
      if (disableValidation) {
        setParseError('Invalid JSON');
        return;
      }
    }
    if (typeof parsed === 'number') {
      setParseError('Invalid JSON');
      return;
    }
    onChangeValue(parsed);
    onCloseModal();
  }, [onChangeValue, onCloseModal, jsonValue, disableValidation]);

  return (
    <div className="flex flex-col gap-y-1">
      {label && <Label label={label} htmlFor={elementId} />}
      <InputPopup
        disabled={disabled || isReadOnlyAdmin}
        open={isModalOpen}
        selectedValue={committedJsonValue}
        onOpen={onOpenModal}
        emptyValueText={t(BasicI18nKey.NoData)}
        inputClassName={inputClassName}
      >
        <Popup
          onClose={onCancelModal}
          header={t(EntityPlaceholdersI18nKey.Object)}
          portalId="jsonInputModal"
          open={isModalOpen}
          mainButtons={getFormPopupButtons({
            cancelLabel: t(ButtonsI18nKey.Cancel),
            submitLabel: t(ButtonsI18nKey.Apply),
            isSubmitDisabled: (!isValid && !disableValidation) || !!parseError,
            onCancel: onCancelModal,
            onSubmit: onApply,
          })}
        >
          <div className="px-6 py-4 flex flex-col gap-1">
            <div className="h-[540px] max-h-[35vh]">
              <JsonEditorBase value={jsonValue} onChange={onChangeJsonValue} onValidateJSON={onValidateJSON} />
            </div>
            {disableValidation && parseError && <ErrorText text={parseError} />}
          </div>
        </Popup>
      </InputPopup>
    </div>
  );
};

export default JsonEditorInput;
