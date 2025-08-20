import React from 'react';

import { IconSearch } from '@tabler/icons-react';
import { IFloatingFilterParams, IFloatingFilterParent } from 'ag-grid-community';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const FloatingFilter = (props: IFloatingFilterParams) => {
  const t = useI18n();

  const onInputChanged = (e: React.ChangeEvent<HTMLInputElement>) => {
    props.parentFilterInstance((instance: IFloatingFilterParent) => {
      instance.onFloatingFilterChanged('contains', e.target.value);
    });
  };

  return (
    <div className="w-full h-[23px] pl-2 self-center flex flex-row items-center border border-primary rounded text-secondary">
      <IconSearch width={12} height={12} className="" />
      <input
        type="text"
        className="w-full border-0 tiny"
        value={props.currentParentModel()?.filter || ''}
        onChange={onInputChanged}
        placeholder={t(BasicI18nKey.Search)}
      />
    </div>
  );
};

export default FloatingFilter;
