'use client';

import { ChangeEvent, FC } from 'react';

import { IconSearch } from '@tabler/icons-react';
import classNames from 'classnames';

import { ROW_DETAIL_FILTER_CELL_BASE } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import FilterToggleButton from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/FilterToggleButton';

interface Props {
  searchQuery: string;
  showDiffsOnly: boolean;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggleDiffsOnly: () => void;
  searchPlaceholder: string;
}

const FilterRow: FC<Props> = ({ searchQuery, showDiffsOnly, onSearchChange, onToggleDiffsOnly, searchPlaceholder }) => (
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
      <FilterToggleButton isActive={showDiffsOnly} onClick={onToggleDiffsOnly} />
    </div>
    <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10')} aria-hidden />
    <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10')} aria-hidden />
    <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10 justify-center pl-3 pr-2')}>
      <FilterToggleButton isActive={showDiffsOnly} onClick={onToggleDiffsOnly} />
    </div>
    <div className={classNames(ROW_DETAIL_FILTER_CELL_BASE, 'top-10 border-r-0 bg-layer-1')} aria-hidden />
  </>
);

export default FilterRow;
