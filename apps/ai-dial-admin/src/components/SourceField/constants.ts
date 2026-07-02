import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { CODE_APP_SOURCE_TYPE } from '@/src/utils/entities/application-source';
import { ApplicationRoute } from '@/src/types/routes';
import { SelectOption } from '@epam/ai-dial-ui-kit';

/**
 * Virtual source-type value used only in the toolset source selector to offer "Model Serving"
 * as a distinct option next to "MCP Container". Both persist as {@link SOURCE_TYPE.CONTAINER};
 * they differ only in which container list is shown. Never written to `source.$type`.
 */
export const MODEL_SERVING_SOURCE_TYPE = 'model-serving';

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
  { value: MODEL_SERVING_SOURCE_TYPE, label: 'Model Serving' },
  { value: SOURCE_TYPE.MCP_REGISTRY, label: 'MCP Registry' },
];

export const ADAPTER_SOURCE_ITEMS: SelectOption[] = [
  // NOTE: Keep order
  { value: SOURCE_TYPE.ENDPOINTS, label: 'External Endpoint' },
  { value: SOURCE_TYPE.CONTAINER, label: 'Adapter Container' },
];

export const APPLICATION_SOURCE_ITEMS: SelectOption[] = [
  // NOTE: Keep order
  { value: SOURCE_TYPE.ENDPOINTS, label: 'Endpoints' },
  { value: SOURCE_TYPE.SCHEMA, label: 'App Runner' },
  { value: CODE_APP_SOURCE_TYPE, label: 'Code App' },
  { value: SOURCE_TYPE.CONTAINER, label: 'Application Container' },
];

export const ASSET_APPLICATION_SOURCE_ITEMS: SelectOption[] = [
  // NOTE: Keep order. Asset applications offer Endpoints + App Runner only (no Container).
  { value: SOURCE_TYPE.ENDPOINTS, label: 'Endpoints' },
  { value: SOURCE_TYPE.SCHEMA, label: 'App Runner' },
  { value: CODE_APP_SOURCE_TYPE, label: 'Code App' },
];

const getItems = (route: ApplicationRoute) => {
  switch (route) {
    case ApplicationRoute.Interceptors:
      return INTERCEPTOR_SOURCE_ITEMS;
    case ApplicationRoute.Models:
      return MODELS_SOURCE_ITEMS;
    case ApplicationRoute.Toolsets:
      return TOOLSET_SOURCE_ITEMS;
    case ApplicationRoute.Adapters:
      return ADAPTER_SOURCE_ITEMS;
    case ApplicationRoute.Applications:
      return APPLICATION_SOURCE_ITEMS;
    case ApplicationRoute.AssetsApplications:
      return ASSET_APPLICATION_SOURCE_ITEMS;
    default:
      return [];
  }
};

export const getSourceItems = (route: ApplicationRoute, deploymentsEnabled?: boolean, mcpRegistryEnabled?: boolean) => {
  const items = getItems(route);

  return items.map((item) => {
    if ((item.value === SOURCE_TYPE.CONTAINER || item.value === MODEL_SERVING_SOURCE_TYPE) && !deploymentsEnabled) {
      return { ...item, disabled: true };
    }
    if (item.value === SOURCE_TYPE.MCP_REGISTRY && !mcpRegistryEnabled) {
      return { ...item, disabled: true };
    }
    return item;
  });
};
