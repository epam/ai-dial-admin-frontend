import { FC } from 'react';

import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import ConfigurationEndpointControl from '@/src/components/BaseControls/Endpoint/ConfigurationEndpointControl';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import InterfacesField from '@/src/components/BaseControls/InterfacesField/InterfacesField';
import OverrideNameControl from '@/src/components/BaseControls/OverrideName';
import TopicsControl from '@/src/components/BaseControls/Topics';
import CatalogSchemaField from '@/src/components/CatalogProperties/CatalogSchemaField';
import KeyValueGrid from '@/src/components/Common/KeyValueGrid/KeyValueGrid';
import Defaults from '@/src/components/Defaults/Defaults';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import { INTERCEPTOR_INTERFACE_TYPES } from '@/src/constants/deployment-interfaces';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialInterceptorResource, DialResourceFeatures } from '@/src/models/dial/resource';
import type { CatalogSchemaOptions } from '@/src/server/catalog-schemas/read-options';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  asset: DialInterceptorResource;
  catalogSchemas?: CatalogSchemaOptions;
  onChange: (asset: DialInterceptorResource) => void;
}

const InterceptorAssetProperties: FC<Props> = ({ asset, catalogSchemas, onChange }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col">
      <ResourceInfoHeader entity={asset} />
      <div className="flex flex-col gap-y-8 mt-8">
        <DisplayNameControl
          displayName={asset.displayName}
          required
          isFullWidth={false}
          onChange={(displayName) => onChange({ ...asset, displayName })}
        />
        <DescriptionControl entity={asset} onChangeEntity={onChange} isFullWidth={false} />
        <OverrideNameControl entity={asset} onChangeEntity={onChange} />
        <EndpointControl
          id="base_url"
          label={t(EntityFieldsI18nKey.baseUrl)}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          endpoint={asset.baseUrl}
          onChange={(baseUrl) => onChange({ ...asset, baseUrl })}
        />
        <InterfacesField
          interfaces={asset.interfaces}
          onChangeInterfaces={(interfaces) => onChange({ ...asset, interfaces })}
          allowedTypes={INTERCEPTOR_INTERFACE_TYPES}
          entityBaseUrl={asset.baseUrl}
          view={ApplicationRoute.PlatformInterceptors}
          isAsset
        />
        <EndpointControl
          id="endpoint"
          label={t(EntityFieldsI18nKey.endpoint)}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          endpoint={asset.endpoint}
          onChange={(endpoint) => onChange({ ...asset, endpoint })}
        />
        <ConfigurationEndpointControl
          endpoint={asset.features?.configuration_endpoint}
          onChange={(configuration_endpoint) =>
            onChange({ ...asset, features: { ...asset.features, configuration_endpoint } as DialResourceFeatures })
          }
        />
        <Defaults values={asset.defaults} onChangeValues={(defaults) => onChange({ ...asset, defaults })} />
        <KeyValueGrid
          label={t(EntityFieldsI18nKey.defaultHeaders)}
          value={asset.defaultHeaders}
          onChange={(defaultHeaders) => onChange({ ...asset, defaultHeaders })}
        />
        <TopicsControl entity={asset} onChange={onChange} view={ApplicationRoute.PlatformInterceptors} />
        <ForwardAuthTokenField view={ApplicationRoute.PlatformInterceptors} entity={asset} onChangeEntity={onChange} />
        <CatalogSchemaField
          schemaId={asset.catalogSchemaId}
          options={catalogSchemas?.options}
          optionsError={catalogSchemas?.error}
          onChange={(catalogSchemaId) => onChange({ ...asset, catalogSchemaId })}
        />
      </div>
    </div>
  );
};

export default InterceptorAssetProperties;
