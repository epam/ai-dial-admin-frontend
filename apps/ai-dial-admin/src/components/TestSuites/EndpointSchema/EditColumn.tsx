'use client';

import { FC, useCallback, useEffect, useState } from 'react';

import {
  DialCloseButton,
  DialInput,
  DialNeutralButton,
  DialPrimaryButton,
  DialSelectField,
} from '@epam/ai-dial-ui-kit';

import { getSchemaTypes } from '@/src/components/TestSuites/utils/schema';
import {
  ButtonsI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  TestSuitesI18nKey,
} from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ResponseColumn } from '@/src/models/evaluation/test-suite';

interface ColumnsProps {
  column: ResponseColumn;
  onChangeColumn: (responseColumn: ResponseColumn) => void;
  onClose: () => void;
}

const EditColumn: FC<ColumnsProps> = ({ column, onChangeColumn, onClose }) => {
  const t = useI18n();
  const [editableColumn, setEditableColumn] = useState(column);

  useEffect(() => {
    setEditableColumn(column);
  }, [column]);

  const onSaveColumn = useCallback(() => {
    onChangeColumn(editableColumn);
    onClose();
  }, [editableColumn, onChangeColumn, onClose]);

  return (
    <div className="flex flex-col gap-2 h-[310px]">
      <div className="flex flex-row justify-between">
        <h3>{t(TestSuitesI18nKey.EditColumn)}</h3>
        <DialCloseButton onClose={onClose} />
      </div>
      <div className="flex flex-row">
        <div className="flex flex-col gap-4 w-[60%]">
          <DialInput
            id="name"
            labelProps={{ label: t(EntityFieldsI18nKey.displayName), required: true }}
            placeholder={t(EntityPlaceholdersI18nKey.DisplayName)}
            value={editableColumn.displayName}
            onChange={(value) => setEditableColumn({ ...editableColumn, displayName: value || '', name: value || '' })}
          />
          <DialInput
            id="expression"
            labelProps={{ label: `JSONata ${t(EntityFieldsI18nKey.expression)}`, required: true }}
            placeholder={t(EntityPlaceholdersI18nKey.Expression)}
            value={editableColumn.expression}
            onChange={(value) => setEditableColumn({ ...editableColumn, expression: value || '' })}
          />
          <DialSelectField
            id="type"
            containerClassName="w-[180px]"
            label={t(EntityFieldsI18nKey.type)}
            value={editableColumn.type}
            options={getSchemaTypes().map((type) => ({ value: type.toUpperCase(), label: type }))}
            onChange={(value) => setEditableColumn({ ...editableColumn, type: value as string })}
            required
          />
          <div className="w-full flex flex-row gap-4 justify-end">
            <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
            <DialPrimaryButton
              label={t(TestSuitesI18nKey.SaveColumn)}
              onClick={onSaveColumn}
              disabled={!editableColumn.displayName || !editableColumn.expression || !editableColumn.type}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditColumn;
