'use client';

import { DialInput } from '@epam/ai-dial-ui-kit';
import { useCallback } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { STANDARD_CONTROL_WIDTH } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

interface Props<T> {
  entity: T;
  onChangeEntity: (entity: T) => void;
}

const OverrideNameControl = <T extends { overrideName?: string }>({ entity, onChangeEntity }: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const onChange = useCallback(
    (overrideName?: string) => {
      onChangeEntity({ ...entity, overrideName });
    },
    [entity, onChangeEntity],
  );

  return (
    <DialInput
      containerClassName={STANDARD_CONTROL_WIDTH}
      id="overrideName"
      labelProps={{ label: t(EntityFieldsI18nKey.overrideName) }}
      placeholder={t(EntityPlaceholdersI18nKey.OverrideName)}
      value={entity.overrideName}
      onChange={onChange}
      disabled={isReadOnlyAdmin}
    />
  );
};

export default OverrideNameControl;
