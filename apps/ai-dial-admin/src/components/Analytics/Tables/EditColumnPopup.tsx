'use client';

import { FC, useState } from 'react';

import { noop } from 'lodash';

import { Popup, DialInput, Switch, PopupSize, Tooltip } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { IconLock } from '@tabler/icons-react';

import EnumValuesField from '@/src/components/Analytics/Tables/EnumValuesField';
import { buildColumnEditPatch } from '@/src/components/Analytics/Tables/utils';
import {
  ANALYTICS_DESCRIPTION_MAX_LENGTH,
  ANALYTICS_DISPLAY_NAME_MAX_LENGTH,
  ANALYTICS_TAG_MAX_LENGTH,
} from '@/src/constants/analytics/tables';
import { AnalyticsTableAccessI18nKey, AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsSchemaPatch, AnalyticsTableColumn } from '@/src/models/analytics/table';
import { ColumnEditValues } from '@/src/models/analytics/tables-ui';
import { getAnalyticsIdentifierError, getAnalyticsLengthError } from '@/src/utils/validation/analytics-table-error';

interface Props {
  column: AnalyticsTableColumn;
  renameDisabled?: boolean;
  sensitiveDisabled?: boolean;
  // The viewer lacks the sensitive clearance on this table, so the service would refuse the change.
  isSensitiveLocked?: boolean;
  existingNames?: string[];
  onClose: () => void;
  onSubmit: (patch: AnalyticsSchemaPatch) => void;
}

const EditColumnPopup: FC<Props> = ({
  column,
  renameDisabled,
  sensitiveDisabled,
  isSensitiveLocked,
  existingNames = [],
  onClose,
  onSubmit,
}) => {
  const t = useI18n();

  const [values, setValues] = useState<ColumnEditValues>({
    name: column.name,
    display_name: column.display_name ?? '',
    tag: column.tag ?? '',
    description: column.description ?? '',
    sensitive: column.sensitive ?? false,
  });

  const getSensitiveCaption = (): string | undefined => {
    if (sensitiveDisabled) return t(AnalyticsTablesI18nKey.ScanColumnNotSensitive);
    if (isSensitiveLocked) return t(AnalyticsTableAccessI18nKey.SensitiveLocked);
  };

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

  // Read-only by contract, not by choice: the service rejects a schema-patch `update` carrying `enum_values`
  // with 422 rather than ignoring it, since widening a ClickHouse enum rewrites the column. Shown rather
  // than omitted so the closed domain is discoverable at all — `buildColumnEditPatch` never emits the key.
  const enumValues = column.type === AnalyticsFieldType.Enum ? (column.enum_values ?? []) : [];

  return (
    <Popup
      open
      portalId="qb-column-edit"
      size={PopupSize.Sm}
      header={t(AnalyticsTablesI18nKey.EditColumnTitle)}
      onClose={onClose}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Save),
        isSubmitDisabled: !patch,
        onCancel: onClose,
        onSubmit: () => patch && onSubmit(patch),
      })}
    >
      <div className="flex flex-col gap-4 p-6">
        <DialInput
          id="column-edit-name"
          labelProps={{ label: t(AnalyticsTablesI18nKey.ColumnName) }}
          value={values.name}
          disabled={renameDisabled}
          error={nameError?.text}
          invalid={Boolean(nameError)}
          onChange={setValue('name')}
        />
        <DialInput
          id="column-edit-display-name"
          labelProps={{ label: t(AnalyticsTablesI18nKey.DisplayName) }}
          value={values.display_name}
          error={displayNameError?.text}
          invalid={Boolean(displayNameError)}
          onChange={setValue('display_name')}
        />
        <DialInput
          id="column-edit-tag"
          labelProps={{ label: t(AnalyticsTablesI18nKey.Tag) }}
          value={values.tag}
          error={tagError?.text}
          invalid={Boolean(tagError)}
          onChange={setValue('tag')}
        />
        <DialInput
          id="column-edit-description"
          labelProps={{ label: t(AnalyticsTablesI18nKey.Description) }}
          value={values.description}
          error={descriptionError?.text}
          invalid={Boolean(descriptionError)}
          onChange={setValue('description')}
        />
        {enumValues.length > 0 && (
          <div className="flex flex-col gap-2">
            {/* The same field the schema editor authors the domain with, read-only — so the domain reads the
                same in both places, and the app's own tag treatment applies instead of a bespoke one. */}
            <EnumValuesField disabled rowId={column.name} values={enumValues} />
            <span className="dial-small-text text-secondary">{t(AnalyticsTablesI18nKey.EnumValuesImmutable)}</span>
          </div>
        )}
        <Switch
          id="column-edit-nullable"
          labelProps={{ label: t(AnalyticsTablesI18nKey.Nullable) }}
          isOn={Boolean(column.nullable)}
          disabled
          caption={t(AnalyticsTablesI18nKey.ColumnNullableFixed)}
          onChange={noop}
        />
        <div className="flex items-start gap-2">
          <Switch
            id="column-edit-sensitive"
            labelProps={{ label: t(AnalyticsTablesI18nKey.Sensitive) }}
            isOn={values.sensitive}
            disabled={sensitiveDisabled || isSensitiveLocked}
            caption={getSensitiveCaption()}
            onChange={setSensitive}
          />
          {isSensitiveLocked && (
            <Tooltip tooltip={t(AnalyticsTableAccessI18nKey.SensitiveLocked)}>
              <IconLock size={16} className="text-secondary" aria-hidden />
            </Tooltip>
          )}
        </div>
      </div>
    </Popup>
  );
};

export default EditColumnPopup;
