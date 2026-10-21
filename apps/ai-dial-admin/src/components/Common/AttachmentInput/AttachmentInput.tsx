'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialLabel, DialRadioButton } from '@epam/ai-dial-ui-kit';
import { isEqual } from 'lodash';

import { ALL_ATTACHMENTS } from '@/src/constants/dial-base-entity';
import { AttachmentsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import MultiValueAutocomplete, {
  MultiValueOption,
} from '@/src/components/Common/MultiValueAutocomplete/MultiValueAutocomplete';

export enum AttachmentType {
  NONE = 'none',
  ALL = 'all',
  SPECIFIC = 'specific',
}

export interface Props {
  availableItems: MultiValueOption[];
  initialValues?: string[];
  placeholder?: string;
  label?: string;
  id?: string;
  required?: boolean;
  onChange?: (values?: string[], type?: AttachmentType) => void;
}

const ALL_ATTACHMENTS_VALUE = [{ label: ALL_ATTACHMENTS, value: ALL_ATTACHMENTS }];

const computeSelectedRadio = (values: MultiValueOption[]): AttachmentType => {
  if (values.length === 0) {
    return AttachmentType.NONE;
  }
  return isEqual(values, ALL_ATTACHMENTS_VALUE) ? AttachmentType.ALL : AttachmentType.SPECIFIC;
};

const AttachmentInput: FC<Props> = ({ availableItems, initialValues, label, placeholder, id, required, onChange }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const selected = useMemo(() => {
    if (!initialValues) return [];
    return initialValues.map((val) => ({ label: val, value: val }));
  }, [initialValues]);

  const [selectedRadio, setSelectedRadio] = useState<AttachmentType>(() => computeSelectedRadio(selected));

  const attachmentTypesError = useMemo(
    () =>
      selectedRadio === AttachmentType.SPECIFIC && selected.length === 0
        ? t(AttachmentsI18nKey.SpecificAttachmentsRequired)
        : '',
    [selected.length, selectedRadio, t],
  );

  useEffect(() => {
    const isAttachmentsValid = selectedRadio !== AttachmentType.SPECIFIC || selected.length > 0;
    dispatch({
      type: ValidationActionType.SetField,
      field: 'attachments',
      isValid: isAttachmentsValid,
    });
  }, [dispatch, selected.length, selectedRadio]);

  const fireChange = useCallback(
    (items?: MultiValueOption[], type?: AttachmentType) => {
      onChange?.(items ? items.map((i) => i.value) : void 0, type);
    },
    [onChange],
  );

  const handleRadioChange = useCallback(
    (option: AttachmentType) => {
      setSelectedRadio(option);
      if (option === AttachmentType.NONE) {
        fireChange([], AttachmentType.NONE);
      } else if (option === AttachmentType.SPECIFIC) {
        fireChange([], AttachmentType.SPECIFIC);
      } else if (option === AttachmentType.ALL) {
        fireChange(ALL_ATTACHMENTS_VALUE, AttachmentType.ALL);
      }
    },
    [fireChange],
  );

  const handleAdd = useCallback((item: MultiValueOption) => fireChange([...selected, item]), [selected, fireChange]);

  const handleRemove = useCallback(
    (index: number) => fireChange(selected.filter((_, i) => i !== index)),
    [selected, fireChange],
  );

  return (
    <div className="flex flex-col w-full relative gap-3">
      <DialLabel label={label} required={required} htmlFor={id} />

      <div className="flex flex-col gap-3">
        <DialRadioButton
          disabled={isReadOnlyAdmin}
          inputId={`${id}-none`}
          name={`${id}-attachment-options`}
          value={AttachmentType.NONE}
          checked={selectedRadio === AttachmentType.NONE}
          onChange={() => handleRadioChange(AttachmentType.NONE)}
          label={t(AttachmentsI18nKey.NoAttachments)}
        />

        <DialRadioButton
          disabled={isReadOnlyAdmin}
          inputId={`${id}-all`}
          name={`${id}-attachment-options`}
          value={AttachmentType.ALL}
          checked={selectedRadio === AttachmentType.ALL}
          onChange={() => handleRadioChange(AttachmentType.ALL)}
          label={t(AttachmentsI18nKey.AllAttachments)}
        />

        <DialRadioButton
          disabled={isReadOnlyAdmin}
          inputId={`${id}-specific`}
          name={`${id}-attachment-options`}
          value={AttachmentType.SPECIFIC}
          checked={selectedRadio === AttachmentType.SPECIFIC}
          onChange={() => handleRadioChange(AttachmentType.SPECIFIC)}
          label={t(AttachmentsI18nKey.SpecificAttachments)}
        />
      </div>

      {selectedRadio === AttachmentType.SPECIFIC && (
        <MultiValueAutocomplete
          selected={selected}
          availableItems={availableItems}
          placeholder={placeholder}
          error={attachmentTypesError}
          isReadOnlyAdmin={isReadOnlyAdmin}
          caption={t(AttachmentsI18nKey.CaptionDescription)}
          onAdd={handleAdd}
          onRemove={handleRemove}
        />
      )}
    </div>
  );
};

export default AttachmentInput;
