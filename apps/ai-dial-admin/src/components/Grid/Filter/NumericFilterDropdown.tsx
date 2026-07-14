'use client';

import { FC, useMemo } from 'react';

import GridFilterDropdown from '@/src/components/Grid/Filter/GridFilterDropdown';
import { NumericGridFilter } from '@/src/components/Grid/Filter/models';
import { getNumericOperatorOptions } from '@/src/components/Grid/Filter/utils/operator-options';
import { GridI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { GridFilterType } from '@/src/types/grid-filter';

interface Props {
  title: string;
  filter: NumericGridFilter | null;
  onChange: (filter: NumericGridFilter | null) => void;
}

const NumericFilterDropdown: FC<Props> = ({ title, filter, onChange }) => {
  const t = useI18n();
  const operatorOptions = useMemo(() => getNumericOperatorOptions(t), [t]);

  return (
    <GridFilterDropdown
      isNumeric
      title={title}
      placeholder={t(GridI18nKey.FilterValue)}
      operatorOptions={operatorOptions}
      defaultOperator={GridFilterType.GREATER_THAN}
      operator={filter?.operator ?? null}
      value={filter != null ? String(filter.value) : ''}
      onApply={(operator, value) => {
        const numeric = Number(value);
        if (Number.isNaN(numeric)) {
          onChange(null);
        } else {
          onChange({ operator, value: numeric });
        }
      }}
      onClear={() => onChange(null)}
    />
  );
};

export default NumericFilterDropdown;
