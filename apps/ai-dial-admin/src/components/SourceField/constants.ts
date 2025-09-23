import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { ApplicationRoute } from '@/src/types/routes';

export const INTERCEPTOR_SOURCE_ITEMS: DropdownItemsModel[] = [
  { id: SOURCE_TYPE.ENDPOINTS, name: 'External Endpoint' },
  { id: SOURCE_TYPE.CONTAINER, name: 'Interceptor Container' },
  { id: SOURCE_TYPE.RUNNER, name: 'Interceptor Template' },
];

export const MODELS_SOURCE_ITEMS: DropdownItemsModel[] = [
  // NOTE: Keep order
  { id: SOURCE_TYPE.ADAPTER, name: 'Adapter' },
  { id: SOURCE_TYPE.CONTAINER, name: 'Model Container' },
  { id: SOURCE_TYPE.ENDPOINTS, name: 'External Endpoint' },
];

export const TOOLSET_SOURCE_ITEMS: DropdownItemsModel[] = [
  // NOTE: Keep order
  { id: SOURCE_TYPE.ENDPOINTS, name: 'External Endpoint' },
  { id: SOURCE_TYPE.CONTAINER, name: 'MCP Container' },
];

const getItems = (route: ApplicationRoute) => {
  switch (route) {
    case ApplicationRoute.Interceptors:
      return INTERCEPTOR_SOURCE_ITEMS;
    case ApplicationRoute.Models:
      return MODELS_SOURCE_ITEMS;
    case ApplicationRoute.Toolsets:
      return TOOLSET_SOURCE_ITEMS;
    default:
      return [];
  }
};

export const getSourceItems = (route: ApplicationRoute, deploymentsEnabled?: boolean) => {
  const items = getItems(route);

  if (!deploymentsEnabled) {
    return items.map((item) => {
      if (item.id === SOURCE_TYPE.CONTAINER) {
        item.disabled = true;
      }
      return item;
    });
  }
  return items;
};
