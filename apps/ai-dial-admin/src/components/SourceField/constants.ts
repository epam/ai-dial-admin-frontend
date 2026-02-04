import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';
import { SelectOption } from '@epam/ai-dial-ui-kit';

export const INTERCEPTOR_SOURCE_ITEMS: SelectOption[] = [
  { value: SOURCE_TYPE.ENDPOINTS, label: 'External Endpoint' },
  { value: SOURCE_TYPE.CONTAINER, label: 'Interceptor Container' },
  { value: SOURCE_TYPE.RUNNER, label: 'Interceptor Template' },
];

export const MODELS_SOURCE_ITEMS: SelectOption[] = [
  // NOTE: Keep order
  { value: SOURCE_TYPE.ADAPTER, label: 'Adapter' },
  { value: SOURCE_TYPE.CONTAINER, label: 'Model Serving' },
  { value: SOURCE_TYPE.ENDPOINTS, label: 'External Endpoint' },
];

export const TOOLSET_SOURCE_ITEMS: SelectOption[] = [
  // NOTE: Keep order
  { value: SOURCE_TYPE.ENDPOINTS, label: 'External Endpoint' },
  { value: SOURCE_TYPE.CONTAINER, label: 'MCP Container' },
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
      if (item.value === SOURCE_TYPE.CONTAINER) {
        item.disabled = true;
      }
      return item;
    });
  }
  return items;
};
