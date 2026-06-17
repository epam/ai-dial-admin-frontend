import { DialErrorText, DialFormPopup, DialInputPopup, DialLabel } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

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
      {label && <DialLabel label={label} htmlFor={elementId} />}
      <DialInputPopup
        disabled={disabled || isReadOnlyAdmin}
        open={isModalOpen}
        selectedValue={committedJsonValue}
        onOpen={onOpenModal}
        emptyValueText={t(BasicI18nKey.NoData)}
        inputClassName={inputClassName}
      >
        <DialFormPopup
          onClose={onCancelModal}
          header={t(EntityPlaceholdersI18nKey.Object)}
          portalId="jsonInputModal"
          open={isModalOpen}
          submitLabel={t(ButtonsI18nKey.Apply)}
          onSubmit={onApply}
          cancelLabel={t(ButtonsI18nKey.Cancel)}
          onCancel={onCancelModal}
          disableSubmitButton={(!isValid && !disableValidation) || !!parseError}
        >
          <div className="px-6 py-4 flex flex-col gap-1">
            <div className="h-[540px] max-h-[35vh]">
              <JsonEditorBase
                value={jsonValue}
                onChange={onChangeJsonValue}
                onValidateJSON={onValidateJSON}
                options={{ stickyScroll: { enabled: false } }}
              />
            </div>
            {disableValidation && parseError && <DialErrorText text={parseError} />}
          </div>
        </DialFormPopup>
      </DialInputPopup>
    </div>
  );
};

export default JsonEditorInput;
