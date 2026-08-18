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
  isAsset?: boolean;
}

const OverrideNameControl = <T extends { overrideName?: string; override_name?: string }>({
  entity,
  onChangeEntity,
  isAsset,
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const overrideNameKey = isAsset ? 'override_name' : 'overrideName';

  const onChange = useCallback(
    (overrideName?: string) => {
      onChangeEntity({ ...entity, [overrideNameKey]: overrideName });
    },
    [entity, onChangeEntity, overrideNameKey],
  );

  return (
    <DialInput
      containerClassName={STANDARD_CONTROL_WIDTH}
      id="overrideName"
      labelProps={{ label: t(EntityFieldsI18nKey.overrideName) }}
      placeholder={t(EntityPlaceholdersI18nKey.OverrideName)}
      value={entity?.[overrideNameKey]}
      onChange={onChange}
      disabled={isReadOnlyAdmin}
    />
  );
};

export default OverrideNameControl;
