'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';

import { IFloatingFilterParams, IFloatingFilterParent } from 'ag-grid-community';

import NumericFilterDropdown from '@/src/components/Grid/Filter/NumericFilterDropdown';
import { NumericGridFilter } from '@/src/components/Grid/Filter/models';
import { GridI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { GridFilterType } from '@/src/types/grid-filter';

interface ParentModel {
  type?: GridFilterType;
  filter?: number;
}

const toNumericFilter = (parentModel: ParentModel | null): NumericGridFilter | null => {
  if (parentModel?.type == null || parentModel.filter == null) {
    return null;
  }
  return { operator: parentModel.type, value: parentModel.filter };
};

const NumericGridFilterFloatingFilter = forwardRef<unknown, IFloatingFilterParams>((props, ref) => {
  const t = useI18n();
  const [filter, setFilter] = useState<NumericGridFilter | null>(() => toNumericFilter(props.currentParentModel()));

  const parentFilterInstanceRef = useRef(props.parentFilterInstance);
  parentFilterInstanceRef.current = props.parentFilterInstance;

  useImperativeHandle(ref, () => ({
    onParentModelChanged(parentModel: ParentModel | null) {
      setFilter(toNumericFilter(parentModel));
    },
  }));

  const onChange = (next: NumericGridFilter | null) => {
    setFilter(next);
    parentFilterInstanceRef.current((instance: IFloatingFilterParent) => {
      if (next) {
        instance.onFloatingFilterChanged(next.operator, next.value);
      } else {
        instance.onFloatingFilterChanged(null, null);
      }
    });
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <NumericFilterDropdown title={t(GridI18nKey.Filter)} filter={filter} onChange={onChange} />
    </div>
  );
});

NumericGridFilterFloatingFilter.displayName = 'NumericGridFilterFloatingFilter';

export default NumericGridFilterFloatingFilter;
