'use client';

import { useCallback, useMemo, useState } from 'react';

import { Popup, OutlinedButton } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';

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
      <OutlinedButton label={t(ButtonsI18nKey.Defaults)} onClick={onOpen} disabled={disabled || isReadOnlyAdmin} />
      <Popup
        onClose={onCancel}
        header={t(EntityFieldsI18nKey.defaults)}
        portalId={`${fieldId}-defaults-modal`}
        open={isOpen}
        mainButtons={getFormPopupButtons({
          cancelLabel: t(ButtonsI18nKey.Cancel),
          submitLabel: t(ButtonsI18nKey.Apply),
          isSubmitDisabled: !isValidJSON,
          onCancel: onCancel,
          onSubmit: onApply,
        })}
      >
        <div className="px-6 py-4 h-[400px] max-h-[50vh]">
          <JsonEditorBase value={draft} onChange={setDraft} onValidateJSON={onValidateJSON} />
        </div>
      </Popup>
    </>
  );
};

export default InterfaceDefaultsButton;
