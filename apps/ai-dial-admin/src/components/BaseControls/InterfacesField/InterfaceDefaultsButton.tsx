'use client';

import { useCallback, useMemo, useState } from 'react';

import { DialFormPopup, DialNeutralButton } from '@epam/ai-dial-ui-kit';

import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { JSONEditorError } from '@/src/types/editor';

interface Props {
  fieldId: string;
  value?: Record<string, unknown>;
  disabled?: boolean;
  onChange: (value: Record<string, unknown>) => void;
}

// Per-interface peer of the entity-level Defaults accordion: freeform JSON (temperature, seed,
// dimensions, ...) has no fixed schema, so a Monaco editor fits better than typed key/value rows here.
const InterfaceDefaultsButton = ({ fieldId, value, disabled, onChange }: Props) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const [isValidJSON, setIsValidJSON] = useState(true);

  const committedValue = useMemo(() => {
    try {
      return JSON.stringify(value || {}, null, 2);
    } catch {
      return '{}';
    }
  }, [value]);

  const onOpen = useCallback(() => {
    setDraft(committedValue);
    setIsValidJSON(true);
    setIsOpen(true);
  }, [committedValue]);

  const onCancel = useCallback(() => setIsOpen(false), []);

  const onValidateJSON = useCallback((errors?: JSONEditorError[]) => {
    setIsValidJSON(!errors?.length);
  }, []);

  const onApply = useCallback(() => {
    try {
      onChange(JSON.parse(draft || '{}'));
      setIsOpen(false);
    } catch {
      setIsValidJSON(false);
    }
  }, [draft, onChange]);

  return (
    <>
      <DialNeutralButton label={t(ButtonsI18nKey.Defaults)} onClick={onOpen} disabled={disabled || isReadOnlyAdmin} />
      <DialFormPopup
        onClose={onCancel}
        header={t(EntityFieldsI18nKey.defaults)}
        portalId={`${fieldId}-defaults-modal`}
        open={isOpen}
        submitLabel={t(ButtonsI18nKey.Apply)}
        onSubmit={onApply}
        cancelLabel={t(ButtonsI18nKey.Cancel)}
        onCancel={onCancel}
        disableSubmitButton={!isValidJSON}
      >
        <div className="px-6 py-4 h-[400px] max-h-[50vh]">
          <JsonEditorBase value={draft} onChange={setDraft} onValidateJSON={onValidateJSON} />
        </div>
      </DialFormPopup>
    </>
  );
};

export default InterfaceDefaultsButton;
