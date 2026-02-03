import { SortDirectionDto, FilterOperatorDto } from '@/src/types/request';

export interface AuditPageData<T> {
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

export interface EvaluationPageData<T> {
  page: number;
  size: number;
  total: number;
  content: T[];
}
