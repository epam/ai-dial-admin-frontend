import { GridFilterType } from '@/src/types/grid-filter';

export interface GridFilter {
  filter: string;
  filterType: string;
  type: GridFilterType;
}
