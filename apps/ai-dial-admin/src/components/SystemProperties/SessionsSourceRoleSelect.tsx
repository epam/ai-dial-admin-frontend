'use client';

import { FC, useCallback, useMemo } from 'react';

import { Select, SelectOption } from '@epam/ai-dial-ui-kit';

import { BasicI18nKey, SystemPropertiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { SessionsRole } from '@/src/models/analytics/sessions-source';
import { roleFieldOptions } from '@/src/utils/analytics/sessions-source';
import { SESSIONS_ROLE_I18N_KEYS } from './constants';
import { isSessionsRoleRequired } from './utils/sessions-source';

const NOT_SET_VALUE = '-';

interface Props {
  role: SessionsRole;
  field?: string | null;
  fields?: AnalyticsEntityField[];
  isDisabled?: boolean;
  onChangeRole: (role: SessionsRole, field: string | null) => void;
}

const SessionsSourceRoleSelect: FC<Props> = ({ role, field, fields, isDisabled, onChangeRole }) => {
  const t = useI18n();
  const isRequired = isSessionsRoleRequired(role);
  const label = t(SESSIONS_ROLE_I18N_KEYS[role]);
  const isUnbound = isRequired && !field;

  const options = useMemo<SelectOption[]>(() => {
    const fieldOptions = roleFieldOptions(role, fields).map(({ name, display_name }) => ({
      value: name,
      label: display_name ? `${display_name} (${name})` : name,
    }));

    return isRequired
      ? fieldOptions
      : [{ value: NOT_SET_VALUE, label: t(SystemPropertiesI18nKey.SessionsSourceRoleNotSet) }, ...fieldOptions];
  }, [fields, isRequired, role, t]);

  const onChange = useCallback(
    (value: string | string[]) => {
      const next = value as string;
      onChangeRole(role, next === NOT_SET_VALUE ? null : next);
    },
    [onChangeRole, role],
  );

  const value = isRequired ? field || undefined : (field ?? NOT_SET_VALUE);
  const error = isUnbound ? t(SystemPropertiesI18nKey.SessionsSourceRoleRequired, { role: label }) : undefined;

  return (
    <Select
      id={`sessions-source-role-${role}`}
      labelProps={{ label, required: isRequired }}
      options={options}
      value={value}
      placeholder={t(SystemPropertiesI18nKey.SessionsSourceFieldPlaceholder)}
      searchable
      searchPlaceholder={t(BasicI18nKey.Search)}
      invalid={isUnbound}
      error={error}
      disabled={isDisabled}
      onChange={onChange}
    />
  );
};

export default SessionsSourceRoleSelect;
