'use client';

import { FC, useCallback, useEffect, useId, useRef, useState } from 'react';

import { EllipsisTooltip, Popup, PopupSize, Textarea } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import InputPopup from '@/src/components/Common/InputPopup/InputPopup';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  value: string;
  onChangeValue: (value: string) => void;
  label: string;
  disabled?: boolean;
  required?: boolean;
  wrapperClassName?: string;
}

const StringEditorInput: FC<Props> = ({
  value,
  onChangeValue,
  label,
  disabled = false,
  required = false,
  wrapperClassName,
}) => {
  const t = useI18n();
  const id = useId();
  const triggerRef = useRef<HTMLDivElement>(null);
  const shouldRestoreFocus = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [original, setOriginal] = useState(value);
  const [isDraftChanged, setIsDraftChanged] = useState(false);
  const isMultiline = /[\r\n]/.test(value);
  const preview = isMultiline ? value.replace(/\r\n|\r|\n/g, ' ') : value;

  const onEditorMount = useCallback((element: HTMLDivElement | null) => {
    element?.querySelector('textarea')?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen && shouldRestoreFocus.current) {
      shouldRestoreFocus.current = false;
      triggerRef.current?.querySelector('button')?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (disabled && isOpen) setIsOpen(false);
  }, [disabled, isOpen]);

  const onOpen = () => {
    setOriginal(value);
    setDraft(value);
    setIsDraftChanged(false);
    setIsOpen(true);
  };

  const onClose = () => {
    shouldRestoreFocus.current = true;
    setIsOpen(false);
  };

  const onApply = () => {
    if (!disabled) onChangeValue(isDraftChanged ? draft : original);
    onClose();
  };

  const onChangeDraft = (next: string) => {
    setDraft(next);
    setIsDraftChanged(true);
  };

  if (disabled) {
    return (
      <div className="flex min-w-0 max-w-full flex-1 overflow-hidden">
        <EllipsisTooltip className="min-w-0" text={value} />
      </div>
    );
  }

  return (
    <div ref={triggerRef} className="w-full min-w-0">
      <InputPopup
        elementId={`${id}-input`}
        inputAriaLabel={label}
        openAriaLabel={`${t(ButtonsI18nKey.Open)} ${label}`}
        required={required}
        invalid={required && value === ''}
        disabled={disabled}
        editable={!isMultiline}
        selectedValue={preview}
        onValueChange={onChangeValue}
        onOpen={onOpen}
        open={isOpen && !disabled}
        wrapperClassName={wrapperClassName}
      >
        <Popup
          open={isOpen && !disabled}
          onClose={onClose}
          header={label}
          portalId={`${id}-string-editor`}
          size={PopupSize.Lg}
          className="bg-layer-3 md:h-[80vh] md:max-h-[800px]"
          footerDivider
          mainButtons={getFormPopupButtons({
            cancelLabel: t(ButtonsI18nKey.Cancel),
            submitLabel: t(ButtonsI18nKey.Apply),
            onCancel: onClose,
            onSubmit: onApply,
          })}
        >
          <div ref={onEditorMount} className="flex h-full min-h-0 flex-col px-6 py-4">
            <Textarea
              aria-label={label}
              value={draft}
              onChange={onChangeDraft}
              spellCheck={false}
              className="overflow-auto flex-1 min-h-0"
              containerClassName="flex-1 min-h-0 [&>div]:flex-1 [&>div]:min-h-0"
            />
          </div>
        </Popup>
      </InputPopup>
    </div>
  );
};

export default StringEditorInput;
