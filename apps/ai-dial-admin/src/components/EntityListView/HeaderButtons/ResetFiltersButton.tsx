import { FC, useEffect, useState } from 'react';

import { IconRestore } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';

import Button from '@/src/components/Common/Button/Button';
import { BasicI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

interface Props {
  gridApi?: GridApi | null;
}

const ResetFiltersButton: FC<Props> = ({ gridApi }) => {
  const t = useI18n();

  const [filtersActive, setFiltersActive] = useState(false);

  useEffect(() => {
    if (!gridApi) return;

    const checkFilters = () => {
      const model = gridApi.getFilterModel();
      setFiltersActive(Object.keys(model ?? {}).length > 0);
    };

    checkFilters();

    gridApi.addEventListener('filterChanged', checkFilters);

    return () => {
      gridApi.removeEventListener('filterChanged', checkFilters);
    };
  }, [gridApi]);

  const resetFilters = () => {
    if (gridApi) {
      gridApi.setFilterModel(null);
      setFiltersActive(false);
    }
  };

  if (!filtersActive) return null;

  return (
    <Button
      title={t(BasicI18nKey.ResetFilters)}
      cssClass="tertiary"
      iconBefore={<IconRestore {...BASE_ICON_PROPS} />}
      onClick={resetFilters}
    />
  );
};

export default ResetFiltersButton;
