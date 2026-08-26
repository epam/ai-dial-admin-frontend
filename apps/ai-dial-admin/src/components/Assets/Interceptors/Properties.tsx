import { FC } from 'react';

import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import ConfigurationEndpointControl from '@/src/components/BaseControls/Endpoint/ConfigurationEndpointControl';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import InterfacesField from '@/src/components/BaseControls/InterfacesField/InterfacesField';
import OverrideNameControl from '@/src/components/BaseControls/OverrideName';
import TopicsControl from '@/src/components/BaseControls/Topics';
import Defaults from '@/src/components/Defaults/Defaults';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import { INTERCEPTOR_INTERFACE_TYPES } from '@/src/constants/deployment-interfaces';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialFeatures } from '@/src/models/dial/features';
import { DialInterceptorResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  asset: DialInterceptorResource;
  onChange: (asset: DialInterceptorResource) => void;
}

const InterceptorAssetProperties: FC<Props> = ({ asset, onChange }) => {
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
        <InterfacesField entity={asset} onChangeEntity={onChange} allowedTypes={INTERCEPTOR_INTERFACE_TYPES} isAsset />
        <EndpointControl
          id="endpoint"
          label={t(EntityFieldsI18nKey.endpoint)}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          endpoint={asset.endpoint}
          onChange={(endpoint) => onChange({ ...asset, endpoint })}
        />
        <ConfigurationEndpointControl
          endpoint={asset.features?.configurationEndpoint}
          onChange={(configurationEndpoint) =>
            onChange({ ...asset, features: { ...asset.features, configurationEndpoint } as DialFeatures })
          }
        />
        <Defaults values={asset.defaults} onChangeValues={(defaults) => onChange({ ...asset, defaults })} />
        <TopicsControl entity={asset} onChange={onChange} view={ApplicationRoute.AssetsInterceptors} />
        <ForwardAuthTokenField view={ApplicationRoute.AssetsInterceptors} entity={asset} onChangeEntity={onChange} />
      </div>
    </div>
  );
};

export default InterceptorAssetProperties;
