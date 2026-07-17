'use client';

import { ChangeEvent, FC } from 'react';

import classNames from 'classnames';

import NumericFilterDropdown from '@/src/components/Grid/Filter/NumericFilterDropdown';
import { ROW_DETAIL_FILTER_CELL_BASE } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import {
  RowDetailDeltaFilter,
  RowDetailFieldFilter,
  RowDetailValueFilter,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';
import TextFilterCell from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/TextFilterCell';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  searchQuery: string;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  searchPlaceholder: string;
  fieldFilter: RowDetailFieldFilter | null;
  onFieldFilterChange: (filter: RowDetailFieldFilter | null) => void;
  primarySearchQuery: string;
  onPrimarySearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  primaryValueFilter: RowDetailValueFilter | null;
  onPrimaryValueFilterChange: (filter: RowDetailValueFilter | null) => void;
  secondarySearchQuery: string;
  onSecondarySearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  secondaryValueFilter: RowDetailValueFilter | null;
  onSecondaryValueFilterChange: (filter: RowDetailValueFilter | null) => void;
  deltaFilter: RowDetailDeltaFilter | null;
  onDeltaFilterChange: (filter: RowDetailDeltaFilter | null) => void;
}

const FilterRow: FC<Props> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  fieldFilter,
  onFieldFilterChange,
  primarySearchQuery,
  onPrimarySearchChange,
  primaryValueFilter,
  onPrimaryValueFilterChange,
  secondarySearchQuery,
  onSecondarySearchChange,
  secondaryValueFilter,
  onSecondaryValueFilterChange,
  deltaFilter,
  onDeltaFilterChange,
}) => {
  const t = useI18n();
  const filterTitle = t(RunsI18nKey.RunCompareFilterField);

  return (
    <>
      <TextFilterCell
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        filter={fieldFilter}
        onFilterChange={onFieldFilterChange}
        filterTitle={filterTitle}
      />
      <TextFilterCell
        searchQuery={primarySearchQuery}
        onSearchChange={onPrimarySearchChange}
        searchPlaceholder={searchPlaceholder}
        filter={primaryValueFilter}
        onFilterChange={onPrimaryValueFilterChange}
        filterTitle={filterTitle}
      />
      <TextFilterCell
        searchQuery={secondarySearchQuery}
        onSearchChange={onSecondarySearchChange}
        searchPlaceholder={searchPlaceholder}
        filter={secondaryValueFilter}
        onFilterChange={onSecondaryValueFilterChange}
        filterTitle={filterTitle}
      />
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
