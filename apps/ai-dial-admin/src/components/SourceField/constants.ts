import { ColDef } from 'ag-grid-community';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';

export const SOURCE_ITEMS = [
  { id: SOURCE_TYPE.EXTERNAL_ENDPOINT, name: 'External Endpoint' },
  { id: SOURCE_TYPE.INTERCEPTOR_CONTAINER, name: 'Interceptor Container' },
];

export const INTERCEPTOR_CONTAINER_COLUMNS: ColDef[] = [
  { field: 'name', headerName: 'Name', sort: 'asc' },
  { field: 'description', headerName: 'Description' },
  { field: 'image', headerName: 'Interceptor Image' },
];
