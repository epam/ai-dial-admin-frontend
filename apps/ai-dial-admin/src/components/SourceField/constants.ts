import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DropdownItemsModel } from '@/src/models/dropdown-item';

export const INTERCEPTOR_SOURCE_ITEMS: DropdownItemsModel[] = [
  { id: SOURCE_TYPE.ENDPOINTS, name: 'External Endpoint' },
  { id: SOURCE_TYPE.CONTAINER, name: 'Interceptor Container' },
  { id: SOURCE_TYPE.RUNNER, name: 'Interceptor Template' },
];
export const MODELS_SOURCE_ITEMS: DropdownItemsModel[] = [
  { id: SOURCE_TYPE.ENDPOINTS, name: 'External Endpoint' },
  { id: SOURCE_TYPE.CONTAINER, name: 'Model Container' },
];
