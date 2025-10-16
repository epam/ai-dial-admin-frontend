import { useCallback } from 'react';
import { DialSelect, SelectOption } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import Field from '@/src/components/Common/Field/Field';

interface Props<T> {
  entity?: T;
  readonly?: boolean;
  onChangeEntity: (entity: T) => void;
}

const MaxRetryAttempts = <T extends { maxRetryAttempts?: number }>({ entity, onChangeEntity, readonly }: Props<T>) => {
  const t = useI18n();

  const items: SelectOption[] = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' },
    { value: '5', label: '5' },
  ];

  const activeMaxAttempts = entity?.maxRetryAttempts?.toString() || '1';
  const onChange = useCallback(
    (value: string) => {
      onChangeEntity({ ...entity, maxRetryAttempts: Number(value) } as T);
    },
    [entity, onChangeEntity],
  );

  return (
    <div className="flex flex-col w-[180px]">
      <Field fieldTitle={t(EntityFieldsI18nKey.maxRetryAttempts)} />
      <DialSelect
        disabled={readonly}
        value={activeMaxAttempts}
        options={items}
        onChange={(value) => onChange(value as string)}
      />
    </div>
  );
};

export default MaxRetryAttempts;
