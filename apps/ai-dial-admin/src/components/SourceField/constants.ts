import { SOURCE_TYPE } from '@/src/components/SourceField/types';

export const SOURCE_ITEMS = [
  { id: SOURCE_TYPE.ENDPOINTS, name: 'External Endpoint' },
  { id: SOURCE_TYPE.CONTAINER, name: 'Interceptor Container' },
  { id: SOURCE_TYPE.RUNNER, name: 'Interceptor Template' },
];
