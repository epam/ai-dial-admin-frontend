import { useCallback } from 'react';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { BasicI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DropdownItemsModel } from '@/src/models/dropdown-item';

interface Props<T> {
  entity?: T;
  readonly?: boolean;
  onChangeEntity: (entity: T) => void;
}

const MaxRetryAttempts = <T extends { maxRetryAttempts?: number }>({ entity, onChangeEntity, readonly }: Props<T>) => {
  const t = useI18n();

  const items: DropdownItemsModel[] = [
    { id: '0', name: t(BasicI18nKey.None) },
    { id: '1', name: '1' },
    { id: '2', name: '2' },
    { id: '3', name: '3' },
    { id: '4', name: '4' },
    { id: '5', name: '5' },
  ];

  const activeMaxAttempts = entity?.maxRetryAttempts?.toString() || '0';
  const onChange = useCallback(
    (value: string) => {
      onChangeEntity({ ...entity, maxRetryAttempts: Number(value) } as T);
    },
    [entity, onChangeEntity],
  );

  return (
    <div className="w-full lg:w-[35%]">
      <DropdownField
        selectedValue={activeMaxAttempts}
        elementId="maxRetryAttempts"
        items={items}
        disabled={readonly}
        fieldTitle={t(EntityFieldsI18nKey.maxRetryAttempts)}
        onChange={onChange}
      />
    </div>
  );
};

export default MaxRetryAttempts;
