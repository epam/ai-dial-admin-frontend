'use client';

import { FC, useState } from 'react';

import { DialFormPopup, DialInput, DialSwitch, PopupSize } from '@epam/ai-dial-ui-kit';

import { buildColumnEditPatch } from '@/src/components/Analytics/Tables/utils';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsSchemaPatch, AnalyticsTableColumn } from '@/src/models/analytics/table';
import { ColumnEditValues } from '@/src/models/analytics/tables-ui';

interface Props {
  column: AnalyticsTableColumn;
  renameDisabled?: boolean;
  onClose: () => void;
  onSubmit: (patch: AnalyticsSchemaPatch) => void;
}

const EditColumnPopup: FC<Props> = ({ column, renameDisabled, onClose, onSubmit }) => {
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

  const patch = values.name.trim() ? buildColumnEditPatch(column, values) : null;

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
          onChange={setValue('name')}
        />
        <DialInput
          id="column-edit-display-name"
          labelProps={{ label: t(AnalyticsTablesI18nKey.DisplayName) }}
          value={values.display_name}
          onChange={setValue('display_name')}
        />
        <DialInput
          id="column-edit-tag"
          labelProps={{ label: t(AnalyticsTablesI18nKey.Tag) }}
          value={values.tag}
          onChange={setValue('tag')}
        />
        <DialInput
          id="column-edit-description"
          labelProps={{ label: t(AnalyticsTablesI18nKey.Description) }}
          value={values.description}
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
