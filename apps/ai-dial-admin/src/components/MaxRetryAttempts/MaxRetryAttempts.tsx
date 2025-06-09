import { FC, useCallback } from 'react';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { BasicI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DropdownItemsModel } from '@/src/models/dropdown-item';

interface Props {
  maxRetryAttempts?: number;
  onChangeMaxRetryAttempts: (num?: number) => void;
}

const MaxRetryAttempts: FC<Props> = ({ maxRetryAttempts, onChangeMaxRetryAttempts }) => {
  const t = useI18n();

  const items: DropdownItemsModel[] = [
    {
      id: '0',
      name: t(BasicI18nKey.None),
    },
    {
      id: '1',
      name: '1',
    },
    {
      id: '2',
      name: '2',
    },
    {
      id: '3',
      name: '3',
    },
    {
      id: '4',
      name: '4',
    },
    {
      id: '5',
      name: '5',
    },
  ];
  const activeMaxAttempts = maxRetryAttempts?.toString() || '0';
  const onChange = useCallback(
    (value: string) => {
      onChangeMaxRetryAttempts(Number(value));
    },
    [onChangeMaxRetryAttempts],
  );

  return (
    <div className="w-full lg:w-[35%]">
      <DropdownField
        selectedValue={activeMaxAttempts}
        elementId="maxRetryAttempts"
        items={items}
        fieldTitle={t(EntitiesI18nKey.MaxRetryAttempts)}
        onChange={onChange}
      />
    </div>
  );
};

export default MaxRetryAttempts;
