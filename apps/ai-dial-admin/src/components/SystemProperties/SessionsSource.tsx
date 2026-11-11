'use client';

import { FC, useCallback, useMemo } from 'react';

import { Select, SelectOption } from '@epam/ai-dial-ui-kit';

import { SESSIONS_ROLES } from '@/src/constants/analytics/sessions-source';
import { BasicI18nKey, SystemPropertiesI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { SessionsRole, SessionsSourceSetting } from '@/src/models/analytics/sessions-source';
import SessionsSourceRoleSelect from './SessionsSourceRoleSelect';

interface Props {
  setting: SessionsSourceSetting;
  tables: string[];
  fields?: AnalyticsEntityField[];
  isLoading?: boolean;
  onChangeBaseTable: (table: string) => void;
  onChangeRole: (role: SessionsRole, field: string | null) => void;
}

const SessionsSource: FC<Props> = ({ setting, tables, fields, isLoading, onChangeBaseTable, onChangeRole }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isDisabled = isReadOnlyAdmin || isLoading;

  const tableOptions = useMemo<SelectOption[]>(() => tables.map((table) => ({ value: table, label: table })), [tables]);

  const onBaseTableChange = useCallback(
    (value: string | string[]) => {
      onChangeBaseTable(value as string);
    },
    [onChangeBaseTable],
  );

  return (
    <div className="h-full flex flex-col pt-3">
      <div className="flex items-center mb-4 h-10">
        <h1>{t(SystemPropertiesI18nKey.SessionsSourceTitle)}</h1>
      </div>
      <p className="dial-small-text text-secondary mb-4 max-w-[560px]">
        {t(SystemPropertiesI18nKey.SessionsSourceDescription)}
      </p>
      <div className="flex flex-col gap-4 max-w-[420px]">
        <Select
          id="sessions-source-base-table"
          labelProps={{ label: t(SystemPropertiesI18nKey.SessionsSourceBaseTableLabel), required: true }}
          options={tableOptions}
          value={setting.baseTable || undefined}
          placeholder={t(SystemPropertiesI18nKey.SessionsSourceBaseTablePlaceholder)}
          caption={t(SystemPropertiesI18nKey.SessionsSourceBaseTableCaveat)}
          searchable
          searchPlaceholder={t(BasicI18nKey.Search)}
          disabled={isDisabled}
          onChange={onBaseTableChange}
        />
        {SESSIONS_ROLES.map((role) => (
          <SessionsSourceRoleSelect
            key={role}
            role={role}
            field={setting.roles[role]}
            fields={fields}
            isDisabled={isDisabled}
            onChangeRole={onChangeRole}
          />
        ))}
      </div>
    </div>
  );
};

export default SessionsSource;
