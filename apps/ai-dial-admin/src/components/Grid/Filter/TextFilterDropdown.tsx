'use client';

import { FC, useMemo } from 'react';

import GridFilterDropdown from '@/src/components/Grid/Filter/GridFilterDropdown';
import { TextGridFilter } from '@/src/components/Grid/Filter/models';
import { getTextOperatorOptions } from '@/src/components/Grid/Filter/utils/operator-options';
import { GridI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { GridFilterType } from '@/src/types/grid-filter';

interface Props {
  title: string;
  filter: TextGridFilter | null;
  onChange: (filter: TextGridFilter | null) => void;
}

const TextFilterDropdown: FC<Props> = ({ title, filter, onChange }) => {
  const t = useI18n();
  const operatorOptions = useMemo(() => getTextOperatorOptions(t), [t]);

  return (
    <GridFilterDropdown
      title={title}
      placeholder={t(GridI18nKey.FilterValue)}
      operatorOptions={operatorOptions}
      defaultOperator={GridFilterType.CONTAINS}
      operator={filter?.operator ?? null}
      value={filter?.value ?? ''}
      onApply={(operator, value) => onChange({ operator, value })}
      onClear={() => onChange(null)}
    />
  );
};

export default TextFilterDropdown;
