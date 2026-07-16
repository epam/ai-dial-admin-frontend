'use client';

import { ChangeEvent, FC } from 'react';

import { IconSearch } from '@tabler/icons-react';
import classNames from 'classnames';

import TextFilterDropdown from '@/src/components/Grid/Filter/TextFilterDropdown';
import { ROW_DETAIL_FILTER_CELL_BASE } from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/constants';
import {
  RowDetailFieldFilter,
  RowDetailValueFilter,
} from '@/src/components/Runs/Compare/ExecutionResults/RowCompareDetails/models';

interface Props {
  searchQuery: string;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  searchPlaceholder: string;
  filter: RowDetailFieldFilter | RowDetailValueFilter | null;
  onFilterChange: (filter: RowDetailFieldFilter | RowDetailValueFilter | null) => void;
  filterTitle: string;
}

const TextFilterCell: FC<Props> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filter,
  onFilterChange,
  filterTitle,
}) => (
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
    <TextFilterDropdown title={filterTitle} filter={filter} onChange={onFilterChange} />
  </div>
);

export default TextFilterCell;
