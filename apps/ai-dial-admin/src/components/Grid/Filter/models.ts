import { GridFilterType } from '@/src/types/grid-filter';

export interface TextGridFilter {
  operator: GridFilterType;
  value: string;
}

export interface NumericGridFilter {
  operator: GridFilterType;
  value: number;
}
