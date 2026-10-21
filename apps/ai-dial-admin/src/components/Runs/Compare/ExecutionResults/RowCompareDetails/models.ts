import { ChangeEvent } from 'react';

import { NumericGridFilter, TextGridFilter } from '@/src/components/Grid/Filter/models';
import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';

export type RowDetailFieldFilter = TextGridFilter;

export type RowDetailValueFilter = TextGridFilter;

export type RowDetailDeltaFilter = NumericGridFilter;

/** The value-column filter of one displayed run; the table keeps the state per slot so a filter stays with its run. */
export interface RowDetailRunFilter {
  slot: CompareRunSlot;
  searchQuery: string;
  onSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  filter: RowDetailValueFilter | null;
  onFilterChange: (filter: RowDetailValueFilter | null) => void;
}
