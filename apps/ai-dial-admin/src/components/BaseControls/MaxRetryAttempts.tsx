import { DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';
import { useCallback } from 'react';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

interface Props<T> {
  entity?: T;
  disabled?: boolean;
  onChangeEntity: (entity: T) => void;
  isAsset?: boolean;
}

const MaxRetryAttempts = <T extends { maxRetryAttempts?: number } | { max_retry_attempts?: number }>({
  entity,
  onChangeEntity,
  disabled,
  isAsset,
}: Props<T>) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const isReadonly = disabled || isReadOnlyAdmin;

  const fieldKey = isAsset ? 'max_retry_attempts' : 'maxRetryAttempts';

  const items: SelectOption[] = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
  ];

  const activeMaxAttempts = (entity as Record<string, number | undefined>)?.[fieldKey]?.toString() || '1';
  const onChange = useCallback(
    (value: string) => {
      onChangeEntity({ ...entity, [fieldKey]: Number(value) } as T);
    },
    [entity, onChangeEntity, fieldKey],
  );

  return (
    <DialSelectField
      disabled={isReadonly}
      id="maxRetryAttempts"
      className="w-[220px]"
      containerClassName="w-[220px]"
      label={t(EntityFieldsI18nKey.maxRetryAttempts)}
      value={activeMaxAttempts}
      options={items}
      onChange={(value) => onChange(value as string)}
    />
  );
};

export default MaxRetryAttempts;
