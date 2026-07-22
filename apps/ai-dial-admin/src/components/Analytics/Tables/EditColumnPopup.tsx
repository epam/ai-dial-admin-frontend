'use client';

import { FC, useState } from 'react';

import { DialFormPopup, DialInput, DialSwitch, PopupSize } from '@epam/ai-dial-ui-kit';

import { buildColumnEditPatch } from '@/src/components/Analytics/Tables/utils';
import {
  ANALYTICS_DESCRIPTION_MAX_LENGTH,
  ANALYTICS_DISPLAY_NAME_MAX_LENGTH,
  ANALYTICS_TAG_MAX_LENGTH,
} from '@/src/constants/analytics/tables';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsSchemaPatch, AnalyticsTableColumn } from '@/src/models/analytics/table';
import { ColumnEditValues } from '@/src/models/analytics/tables-ui';
import { getAnalyticsIdentifierError, getAnalyticsLengthError } from '@/src/utils/validation/analytics-table-error';

interface Props {
  column: AnalyticsTableColumn;
  renameDisabled?: boolean;
  // Exposed names of the table's other columns; a rename must not collide with them.
  existingNames?: string[];
  onClose: () => void;
  onSubmit: (patch: AnalyticsSchemaPatch) => void;
}

const EditColumnPopup: FC<Props> = ({ column, renameDisabled, existingNames = [], onClose, onSubmit }) => {
  const t = useI18n();

  const [values, setValues] = useState<ColumnEditValues>({
    name: column.name,
    display_name: column.display_name ?? '',
    tag: column.tag ?? '',
    description: column.description ?? '',
    sensitive: column.sensitive ?? false,
  });

  const setValue = (key: 'name' | 'display_name' | 'tag' | 'description') => (value?: string) =>
    setValues((prev) => ({ ...prev, [key]: value ?? '' }));

  const setSensitive = (value: boolean) => setValues((prev) => ({ ...prev, sensitive: value }));

  // A rename is only validated when the name actually changes; renaming is disabled for
  // system/grain/ordering-key columns, so an unchanged name never errors.
  const nameChanged = values.name.trim() !== column.name;
  const nameError = nameChanged ? getAnalyticsIdentifierError(values.name, existingNames, t) : null;
  const tagError = getAnalyticsLengthError(values.tag, ANALYTICS_TAG_MAX_LENGTH, t);
  const displayNameError = getAnalyticsLengthError(values.display_name, ANALYTICS_DISPLAY_NAME_MAX_LENGTH, t);
  const descriptionError = getAnalyticsLengthError(values.description, ANALYTICS_DESCRIPTION_MAX_LENGTH, t);
  const hasError = Boolean(nameError || tagError || displayNameError || descriptionError);

  const patch = !hasError && values.name.trim() ? buildColumnEditPatch(column, values) : null;

  return (
    <DialFormPopup
      open
      portalId="qb-column-edit"
      size={PopupSize.Sm}
      header={t(AnalyticsTablesI18nKey.EditColumnTitle)}
      submitLabel={t(ButtonsI18nKey.Save)}
      disableSubmitButton={!patch}
      onClose={onClose}
      onSubmit={() => patch && onSubmit(patch)}
    >
      <div className="flex flex-col gap-4 p-6">
        <DialInput
          id="column-edit-name"
          labelProps={{ label: t(AnalyticsTablesI18nKey.ColumnName) }}
          value={values.name}
          disabled={renameDisabled}
          error={nameError?.text}
          onChange={setValue('name')}
        />
        <DialInput
          id="column-edit-display-name"
          labelProps={{ label: t(AnalyticsTablesI18nKey.DisplayName) }}
          value={values.display_name}
          error={displayNameError?.text}
          onChange={setValue('display_name')}
        />
        <DialInput
          id="column-edit-tag"
          labelProps={{ label: t(AnalyticsTablesI18nKey.Tag) }}
          value={values.tag}
          error={tagError?.text}
          onChange={setValue('tag')}
        />
        <DialInput
          id="column-edit-description"
          labelProps={{ label: t(AnalyticsTablesI18nKey.Description) }}
          value={values.description}
          error={descriptionError?.text}
          onChange={setValue('description')}
        />
        <DialSwitch
          switchId="column-edit-sensitive"
          label={t(AnalyticsTablesI18nKey.Sensitive)}
          isOn={values.sensitive}
          onChange={setSensitive}
        />
      </div>
    </DialFormPopup>
  );
};

export default EditColumnPopup;
