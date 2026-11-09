'use client';

import { FC } from 'react';

import RouterAssetProperties from '@/src/components/Assets/Platform/Routers/Properties';
import ModelResourceFeatures from '@/src/components/Assets/Platform/Models/Features';
import ParametersTab from '@/src/components/Applications/ParametersTab/ParametersTab';
import CatalogPropertiesEditor from '@/src/components/CatalogProperties/CatalogPropertiesEditor';
import { useCatalogProperties } from '@/src/components/CatalogProperties/use-catalog-properties';
import AssetRoles from '@/src/components/EntityView/Roles/AssetRoles';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialModelResource, DialRouterResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import type { CatalogSchemaOptions } from '@/src/server/catalog-schemas/read-options';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';

interface Props {
  activeTab: EntityViewTab;
  selectedRouter: DialRouterResource;
  roles: DialRole[];
  translators?: ResourceInfo[];
  catalogSchemas?: CatalogSchemaOptions;
  schemes?: DialApplicationScheme[];
  isEditorEnabled?: boolean;
  onChange: (router: DialRouterResource) => void;
}

const TabsContent: FC<Props> = ({
  activeTab,
  selectedRouter,
  roles,
  translators,
  catalogSchemas,
  schemes,
  isEditorEnabled,
  onChange,
}) => {
  const catalogProperties = useCatalogProperties(selectedRouter.catalogSchemaId, selectedRouter.catalogProperties);

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <RouterAssetProperties
          asset={selectedRouter}
          translators={translators}
          catalogSchemas={catalogSchemas}
          schemes={schemes}
          onChange={onChange}
        />
      )}

      {activeTab === EntityViewTab.Features && (
        // A router's `features` are the model feature set (Core builds them with the same `createDeploymentFeatures`).
        <ModelResourceFeatures
          entity={selectedRouter as unknown as DialModelResource}
          onChangeEntity={(entity) => onChange(entity as unknown as DialRouterResource)}
        />
      )}

      {activeTab === EntityViewTab.Parameters && (
        <ParametersTab
          application={selectedRouter as unknown as DialApplication}
          applicationSchemes={schemes}
          isEditorEnabled={isEditorEnabled}
          view={ApplicationRoute.PlatformRouters}
          onChange={(router) => onChange(router as unknown as DialRouterResource)}
        />
      )}

      {activeTab === EntityViewTab.Catalog && (
        <CatalogPropertiesEditor
          {...catalogProperties}
          schemaId={selectedRouter.catalogSchemaId}
          values={selectedRouter.catalogProperties}
          onChange={(catalogProperties) => onChange({ ...selectedRouter, catalogProperties })}
        />
      )}

      {activeTab === EntityViewTab.Roles && (
        <AssetRoles view={ApplicationRoute.PlatformRouters} asset={selectedRouter} roles={roles} onChange={onChange} />
      )}
    </>
  );
};

export default TabsContent;
