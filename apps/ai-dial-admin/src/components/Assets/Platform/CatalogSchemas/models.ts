import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';

export interface CatalogSchemaChangeHandler {
  (schema: DialCatalogSchemaResource, isSkipRefresh?: boolean): void;
}

export interface CatalogSchemaProps {
  schema: DialCatalogSchemaResource;
  onChange: CatalogSchemaChangeHandler;
}

export interface CatalogSchemaTabsProps extends CatalogSchemaProps {
  activeTab: EntityViewTab;
  isSkipRefresh?: boolean;
}
