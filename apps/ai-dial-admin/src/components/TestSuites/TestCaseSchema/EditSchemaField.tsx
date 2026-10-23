'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { Checkbox, CloseButton, Input, OutlinedButton, PrimaryButton, Select } from '@epam/ai-dial-ui-kit';

import { BasicI18nKey, ButtonsI18nKey, EntityFieldsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TYPE_OPTIONS } from '@/src/components/TestSuites/TestCaseSchema/constants';
import { TestCaseItemType } from '@/src/types/evaluation';

interface Props {
  field: TestCaseSchema;
  isNew: boolean;
  existingNames: string[];
  onSave: (field: TestCaseSchema) => void;
  onClose: () => void;
}

const EditSchemaField: FC<Props> = ({ field, isNew, existingNames, onSave, onClose }) => {
  const t = useI18n();
  const [editableField, setEditableField] = useState(field);

  useEffect(() => {
    setEditableField(field);
  }, [field]);

  const isDuplicateName = useMemo(() => {
    const trimmedName = editableField.name.trim();
    return trimmedName !== '' && existingNames.includes(trimmedName);
  }, [editableField.name, existingNames]);

  const isSaveDisabled = !editableField.name.trim() || isDuplicateName;

  const onSaveField = useCallback(() => {
    onSave({ ...editableField, name: editableField.name.trim() });
    onClose();
  }, [editableField, onSave, onClose]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-row justify-between">
        <h3>{t(isNew ? BasicI18nKey.AddField : TestSuitesI18nKey.EditField)}</h3>
        <CloseButton onClose={onClose} />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-row gap-4">
          <Input
            id="schema-field-name"
            labelProps={{ label: t(EntityFieldsI18nKey.name), required: true }}
            placeholder={t(EntityFieldsI18nKey.name)}
            value={editableField.name}
            onChange={(value) => setEditableField({ ...editableField, name: value || '' })}
            disabled={!isNew}
            error={isDuplicateName ? t(TestSuitesI18nKey.DuplicateFieldName) : undefined}
          />
          <Select
            id="schema-field-type"
            className="w-[180px]"
            labelProps={{ label: t(EntityFieldsI18nKey.type), required: true }}
            value={editableField.type}
            options={TYPE_OPTIONS}
            onChange={(value) => setEditableField({ ...editableField, type: value as TestCaseItemType })}
          />
          <div className="flex items-end pb-2">
            <Checkbox
              id="schema-field-required"
              labelProps={{ label: t(BasicI18nKey.Required) }}
              isSelected={editableField.required}
              onChange={(checked) => setEditableField({ ...editableField, required: !!checked })}
            />
          </div>
        </div>
        <Input
          id="schema-field-description"
          labelProps={{ label: t(EntityFieldsI18nKey.description) }}
          placeholder={t(EntityFieldsI18nKey.description)}
          value={editableField.description}
          onChange={(value) => setEditableField({ ...editableField, description: value || '' })}
        />
        <div className="w-full flex flex-row gap-4 justify-end">
          <OutlinedButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
          <PrimaryButton label={t(ButtonsI18nKey.Save)} onClick={onSaveField} disabled={isSaveDisabled} />
        </div>
      </div>
    </div>
  );
};

export default EditSchemaField;
