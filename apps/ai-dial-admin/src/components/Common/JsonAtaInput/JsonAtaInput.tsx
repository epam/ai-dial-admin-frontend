import { FC, useCallback, useMemo, useState } from 'react';

import { DialFormPopup, DialInputPopup, Label, PopupSize } from '@epam/ai-dial-ui-kit';
import { JSONSchema7 } from 'json-schema';

import JsonataEditor from '@/src/components/Common/JsonataEditor/JsonataEditor';
import { SchemaTreeSelectResult } from '@/src/components/Common/SchemaGrid/models';
import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { JsonataVariable } from '@/src/models/jsonata';
import { EDITOR_HINTS_OFF_OPTIONS } from './constants';
import ReferenceFieldsPanel from './ReferenceFieldsPanel';

interface Props {
  value: string;
  responseSchema: JSONSchema7;
  label?: string;
  elementId?: string;
  disabled?: boolean;
  inputClassName?: string;
  /** Extra variables suggested alongside the response schema's fields. */
  variables?: JsonataVariable[];
  onChangeValue: (expression: string, type?: string) => void;
}

const JsonAtaInput: FC<Props> = ({
  value,
  responseSchema,
  disabled,
  label,
  elementId,
  inputClassName,
  variables,
  onChangeValue,
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const header = `JSONata ${t(EntityFieldsI18nKey.expression)}`;
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [expression, setExpression] = useState(value);
  const [type, setType] = useState<string | undefined>(undefined);

  const editorOptions = useMemo(() => ({ ...EDITOR_HINTS_OFF_OPTIONS, ariaLabel: header }), [header]);

  const resetDraftFromValue = useCallback(() => {
    setExpression(value);
    setType(undefined);
  }, [value]);

  const onOpenModal = useCallback(() => {
    resetDraftFromValue();
    setIsModalOpen(true);
  }, [resetDraftFromValue]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const onCancelModal = useCallback(() => {
    resetDraftFromValue();
    onCloseModal();
  }, [resetDraftFromValue, onCloseModal]);

  const onApply = useCallback(() => {
    onChangeValue(expression, type);
    onCloseModal();
  }, [expression, type, onChangeValue, onCloseModal]);

  const onPickFromSchema = useCallback((result: SchemaTreeSelectResult) => {
    setExpression(result.expression);
    setType(result.type);
  }, []);

  const onChangeExpression = useCallback((updated: string) => {
    setExpression(updated);
    setType(undefined);
  }, []);

  return (
    <div className="flex flex-col gap-y-1">
      {label && <Label label={label} htmlFor={elementId} />}
      <DialInputPopup
        disabled={disabled || isReadOnlyAdmin}
        open={isModalOpen}
        selectedValue={value}
        onOpen={onOpenModal}
        inputClassName={inputClassName}
      >
        <DialFormPopup
          onClose={onCancelModal}
          header={header}
          portalId="jsonAtaInputModal"
          open={isModalOpen}
          size={PopupSize.Lg}
          onSubmit={onApply}
          submitLabel={t(ButtonsI18nKey.Apply)}
          cancelLabel={t(ButtonsI18nKey.Cancel)}
          onCancel={onCancelModal}
          disableSubmitButton={!expression}
        >
          <div className="px-6 py-4 h-[512px] flex flex-row gap-x-3">
            <ReferenceFieldsPanel responseSchema={responseSchema} onSelect={onPickFromSchema} />
            <div className="flex flex-col flex-1 basis-0 min-w-0 min-h-0 gap-y-1">
              <Label label={header} />
              <div className="flex-1 min-h-0 py-2 bg-layer-2 rounded overflow-hidden border border-secondary">
                <JsonataEditor
                  value={expression}
                  onChange={onChangeExpression}
                  options={editorOptions}
                  variables={variables}
                />
              </div>
            </div>
          </div>
        </DialFormPopup>
      </DialInputPopup>
    </div>
  );
};

export default JsonAtaInput;
