import { ChangeEvent } from 'react';

import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { RowDetailValueFilter } from '@/src/components/Runs/Details/RowDetails/models';

/** The value-column filter of one displayed run; the table keeps the state per slot so a filter stays with its run. */
export interface RowDetailRunFilter {
  slot: CompareRunSlot;
  searchQuery: string;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  filter: RowDetailValueFilter | null;
  onFilterChange: (filter: RowDetailValueFilter | null) => void;
}
