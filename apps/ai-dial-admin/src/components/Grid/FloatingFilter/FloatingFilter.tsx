import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';

import { IconSearch } from '@tabler/icons-react';
import { IFloatingFilterParams, IFloatingFilterParent } from 'ag-grid-community';
import { debounce } from 'lodash';

import { BasicI18nKey } from '@/src/constants/i18n';
import { FLOATING_FILTER_DEBOUNCE_MS } from '@/src/constants/ag-grid';
import { useI18n } from '@/src/locales/client';

const FloatingFilter = (props: IFloatingFilterParams) => {
  const t = useI18n();

  const parentValue = (props.currentParentModel()?.filter as string) ?? '';
  const [value, setValue] = useState<string>(parentValue);

  const parentFilterInstanceRef = useRef(props.parentFilterInstance);
  parentFilterInstanceRef.current = props.parentFilterInstance;

  const applyFilter = useMemo(
    () =>
      debounce((nextValue: string) => {
        parentFilterInstanceRef.current((instance: IFloatingFilterParent) => {
          instance.onFloatingFilterChanged('contains', nextValue);
        });
      }, FLOATING_FILTER_DEBOUNCE_MS),
    [],
  );

  useEffect(() => () => applyFilter.cancel(), [applyFilter]);

  useEffect(() => {
    setValue(parentValue);
  }, [parentValue]);

  const onInputChanged = (e: ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setValue(nextValue);
    applyFilter(nextValue);
  };

  return (
    <div className="w-full h-[23px] pl-2 self-center flex flex-row items-center border border-primary rounded text-secondary">
      <IconSearch width={12} height={12} className="" />
      <input
        type="text"
        className="w-full border-0 dial-tiny dial-input px-3 py-2"
        value={value}
        onChange={onInputChanged}
        placeholder={t(BasicI18nKey.Search)}
      />
    </div>
  );
};

export default FloatingFilter;
