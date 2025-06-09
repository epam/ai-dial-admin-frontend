import { ColDef, ITextFilterParams } from 'ag-grid-community';

import { GridFilterType } from '@/src/types/grid-filter';
import { formatTimestampToDate } from '@/src/utils/formatting/date';
import { getFormattedResourceType } from '@/src/constants/grid-columns/formatters';

const stringFilter: Partial<ColDef> = {
  filterParams: {
    filterOptions: [
      GridFilterType.CONTAINS,
      GridFilterType.NOT_CONTAINS,
      GridFilterType.EQUALS,
      GridFilterType.NOT_EQUAL,
    ],
    maxNumConditions: 1,
    buttons: ['reset', 'apply'],
  } as ITextFilterParams,
};

export const ACTIVITY_AUDIT_COLUMNS: ColDef[] = [
  { field: 'activityType', headerName: 'Activity type', ...stringFilter },
  {
    field: 'resourceType',
    headerName: 'Resource type',
    valueFormatter: ({ value }) => getFormattedResourceType(value),
    tooltipValueGetter: ({ value }) => getFormattedResourceType(value),
    ...stringFilter,
  },
  { field: 'resourceId', headerName: 'Resource identifier', ...stringFilter },
  {
    field: 'epochTimestampMs',
    headerName: 'Time',
    sort: 'desc',
    valueFormatter: ({ value }) => formatTimestampToDate(value),
    tooltipValueGetter: ({ value }) => formatTimestampToDate(value),
    floatingFilter: false,
    filter: false,
  },
  { field: 'initiatedEmail', headerName: 'Initiated', ...stringFilter },
  { field: 'activityId', headerName: 'Activity ID', ...stringFilter },
];
