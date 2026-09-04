'use client';

import { ChangeEvent, FC } from 'react';

import { IconSearch } from '@tabler/icons-react';
import classNames from 'classnames';

import TextFilterDropdown from '@/src/components/Grid/Filter/TextFilterDropdown';
import { TextGridFilter } from '@/src/components/Grid/Filter/models';

interface Props {
  searchQuery: string;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  searchPlaceholder: string;
  filter: TextGridFilter | null;
  onFilterChange: (filter: TextGridFilter | null) => void;
  filterTitle: string;
}

const FILTER_CELL_BASE = 'h-7 px-2 border-b border-r border-secondary flex items-center gap-2 bg-layer-2 min-w-0';

const MetricPivotFilterCell: FC<Props> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  filter,
  onFilterChange,
  filterTitle,
}) => (
  <div className={classNames(FILTER_CELL_BASE)}>
    <div className="flex-1 min-w-0 h-6 pl-2 flex flex-row items-center border border-primary rounded text-secondary">
      <IconSearch width={12} height={12} className="shrink-0" />
      <input
        type="text"
        className="w-full border-0 dial-tiny dial-input px-2 py-0 bg-transparent outline-none"
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
      />
    </div>
    <TextFilterDropdown title={filterTitle} filter={filter} onChange={onFilterChange} />
  </div>
);

export default MetricPivotFilterCell;
