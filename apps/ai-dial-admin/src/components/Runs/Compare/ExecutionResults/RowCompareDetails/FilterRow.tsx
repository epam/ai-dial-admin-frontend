'use client';

import { ChangeEvent, FC } from 'react';

import { IconSearch } from '@tabler/icons-react';
import classNames from 'classnames';

import NumericFilterDropdown from '@/src/components/Grid/Filter/NumericFilterDropdown';
import TextFilterDropdown from '@/src/components/Grid/Filter/TextFilterDropdown';
import { ROW_DETAIL_FILTER_CELL_BASE } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import {
  RowDetailDeltaFilter,
  RowDetailFieldFilter,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  searchQuery: string;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  searchPlaceholder: string;
  fieldFilter: RowDetailFieldFilter | null;
  onFieldFilterChange: (filter: RowDetailFieldFilter | null) => void;
  deltaFilter: RowDetailDeltaFilter | null;
  onDeltaFilterChange: (filter: RowDetailDeltaFilter | null) => void;
}

const FilterRow: FC<Props> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  fieldFilter,
  onFieldFilterChange,
  deltaFilter,
  onDeltaFilterChange,
}) => {
  const t = useI18n();

  return (
    <>
      <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10 gap-2 pl-3 pr-2')}>
        <div className="flex-1 min-w-0 h-6 pl-2 flex flex-row items-center border border-primary rounded text-secondary">
          <IconSearch width={12} height={12} className="shrink-0" />
          <input
            type="text"
            className="w-full border-0 dial-tiny dial-input px-2 py-0 bg-transparent outline-none"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>
        <TextFilterDropdown
          title={t(RunsI18nKey.RunCompareFilterField)}
          filter={fieldFilter}
          onChange={onFieldFilterChange}
        />
      </div>
      <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10')} aria-hidden />
      <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10')} aria-hidden />
      <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10 justify-center pl-3 pr-2')}>
        <NumericFilterDropdown
          title={t(RunsI18nKey.RunCompareFilterDelta)}
          filter={deltaFilter}
          onChange={onDeltaFilterChange}
        />
      </div>
      <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10 border-r-0 bg-layer-1')} aria-hidden />
    </>
  );
};

export default FilterRow;
