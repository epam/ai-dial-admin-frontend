import { SortDirectionDto, FilterOperatorDto } from '@/src/types/request';

export interface PageDto<T> {
  total: number;
  totalPages: number;
  data: T[];
}

export interface SortDto {
  column: string;
  direction: SortDirectionDto;
}

export interface FilterDto {
  column: string;
  value: string | number;
  operator: FilterOperatorDto;
}
