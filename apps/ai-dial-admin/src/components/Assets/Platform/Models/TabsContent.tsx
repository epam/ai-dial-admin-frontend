'use client';

import { FC } from 'react';

import CatalogPropertiesEditor from '@/src/components/CatalogProperties/CatalogPropertiesEditor';
import { useCatalogProperties } from '@/src/components/CatalogProperties/use-catalog-properties';
import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import AssetRoles from '@/src/components/EntityView/Roles/AssetRoles';
import EntityInterceptors from '@/src/components/EntityView/Interceptors/Interceptors';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { AssetModel } from '@/src/models/dial/deployment-asset';
import { DialModelResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import type { CatalogSchemaOptions } from '@/src/server/catalog-schemas/read-options';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ModelResourceFeatures from './Features';
import InvalidModelBanner from './InvalidModelBanner';
import ModelAssetProperties from './Properties';
import UpstreamSecretWarning from './UpstreamSecretWarning';

interface Props {
  activeTab: EntityViewTab;
  selectedModel: AssetModel;
  originalModel: AssetModel;
  roles: DialRole[];
  interceptors: DialInterceptor[];
  globalInterceptors?: string[];
  translators?: ResourceInfo[];
  catalogSchemas?: CatalogSchemaOptions;
  onChange: (model: AssetModel) => void;
}

const TabsContent: FC<Props> = ({
  activeTab,
  selectedModel,
  originalModel,
  roles,
  interceptors,
  globalInterceptors,
  translators,
  catalogSchemas,
  onChange,
}) => {
  const resource = selectedModel as unknown as DialModelResource;
  const catalogProperties = useCatalogProperties(resource.catalogSchemaId, resource.catalogProperties);

  // Passed through whole, deliberately not merged over `selectedModel`. Every control here returns a
  // full copy, and a merge re-adds any key a control removed — which silently defeated clearing a
  // field whose empty value must reach Core as absent rather than `''`.
  const onChangeResource = (model: DialModelResource) => {
    onChange(model as unknown as AssetModel);
  };

  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <>
          <InvalidModelBanner asset={resource} />
          <UpstreamSecretWarning
            originalUpstreams={originalModel.upstreams}
            editedUpstreams={selectedModel.upstreams}
          />
          <ModelAssetProperties
            asset={resource}
            translators={translators}
            catalogSchemas={catalogSchemas}
            onChange={onChangeResource}
          />
        </>
      )}

      {activeTab === EntityViewTab.Features && (
        <ModelResourceFeatures entity={resource} onChangeEntity={onChangeResource} />
      )}

      {activeTab === EntityViewTab.Catalog && (
        <CatalogPropertiesEditor
          {...catalogProperties}
          schemaId={resource.catalogSchemaId}
          values={resource.catalogProperties}
          onChange={(catalogProperties) => onChangeResource({ ...resource, catalogProperties })}
        />
      )}

      {activeTab === EntityViewTab.Roles && (
        <AssetRoles view={ApplicationRoute.PlatformModels} asset={resource} roles={roles} onChange={onChangeResource} />
      )}

      {activeTab === EntityViewTab.Interceptors && (
        <EntityInterceptors
          entity={selectedModel}
          interceptors={interceptors}
          globalInterceptors={globalInterceptors}
          onChangeEntity={onChange}
          view={ApplicationRoute.PlatformModels}
        />
      )}

      {/*
       * `BaseEntity` types its display fields string-only where this resource allows `LocalizedText`.
       * The audit subtree reads the entity's identity, not its display text, so the shape is narrowed
       * here rather than widening `BaseEntity` across the admin-BE half of the console.
       */}
      {activeTab === EntityViewTab.Audit && (
        <EntityAudit entity={selectedModel as unknown as BaseEntity} view={ApplicationRoute.PlatformModels} />
      )}
    </>
  );
};

export default TabsContent;
