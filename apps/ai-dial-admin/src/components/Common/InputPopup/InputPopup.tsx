'use client';

import { FC } from 'react';
import { createPortal } from 'react-dom';

import { DIAL_ICON_SIZE, IconButton, Input, TagInput } from '@epam/ai-dial-ui-kit';
import { IconArrowsDiagonal } from '@tabler/icons-react';

import { InputPopupProps } from '@/src/components/Common/InputPopup/models';
import OverflowValueTooltip from '@/src/components/Common/OverflowValueTooltip/OverflowValueTooltip';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

// ui-kit has no 2.0 input-style popup trigger, so this composes the 2.0 Input and TagInput with a portalled modal.
const InputPopup: FC<InputPopupProps> = ({
  open = false,
  selectedValue,
  children,
  onOpen,
  disabled = false,
  inputClassName,
  wrapperClassName,
  placeholder,
  elementId,
  errorText,
  invalid,
  emptyValueText,
  editable = false,
  onValueChange,
  collapseTagOverflow = false,
  iconBefore,
}) => {
  const t = useI18n();

  const tags = Array.isArray(selectedValue) && selectedValue.length > 0 ? selectedValue : null;
  const text = typeof selectedValue === 'string' ? selectedValue : '';
  const isInvalid = invalid || !!errorText;

  const onOpenPopup = () => {
    if (!disabled) {
      onOpen();
    }
  };

  const openIcon = <IconArrowsDiagonal size={DIAL_ICON_SIZE.SM} aria-hidden />;

  const getIconAfter = () => {
    if (disabled) return undefined;

    return (
      <IconButton className="size-auto" icon={openIcon} aria-label={t(ButtonsI18nKey.Open)} onClick={onOpenPopup} />
    );
  };

  const renderTrigger = () => {
    if (tags) {
      return (
        <div className="relative w-full">
          <TagInput
            id={elementId}
            value={tags}
            readOnly
            disabled={disabled}
            invalid={isInvalid}
            error={errorText}
            collapseTagOverflow={collapseTagOverflow}
            fieldClassName={inputClassName}
          />
          {!disabled && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <IconButton
                className="size-auto"
                icon={openIcon}
                aria-label={t(ButtonsI18nKey.Open)}
                onClick={onOpenPopup}
              />
            </div>
          )}
        </div>
      );
    }

    return (
      <OverflowValueTooltip text={String(text ?? '')}>
        <Input
          id={elementId}
          value={text}
          placeholder={placeholder ?? emptyValueText}
          readOnly={!editable}
          disabled={disabled}
          invalid={isInvalid}
          error={errorText}
          iconBefore={iconBefore}
          iconAfter={getIconAfter()}
          containerClassName={inputClassName}
          onChange={editable ? (value) => onValueChange?.(value ?? '') : undefined}
          wrapperClassName={wrapperClassName}
        />
      </OverflowValueTooltip>
    );
  };

  return (
    <>
      {renderTrigger()}
      {open && createPortal(children, document.body)}
    </>
  );
};

export default InputPopup;
