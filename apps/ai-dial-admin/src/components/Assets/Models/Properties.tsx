import { FC } from 'react';

import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import IconControl from '@/src/components/BaseControls/Icon';
import InterfacesField from '@/src/components/BaseControls/InterfacesField/InterfacesField';
import IntroControl from '@/src/components/BaseControls/Intro';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import ModelTypeControl from '@/src/components/BaseControls/ModelType';
import OverrideNameControl from '@/src/components/BaseControls/OverrideName';
import TopicsControl from '@/src/components/BaseControls/Topics';
import VersionControl from '@/src/components/BaseControls/Version';
import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import Defaults from '@/src/components/Defaults/Defaults';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import EmbeddingDimensions from '@/src/components/ModelView/ModelProperties/EmbeddingDimensions';
import TokenizerModelControl from '@/src/components/BaseControls/TokenizerModel';
import UpstreamEndpoints from '@/src/components/UpstreamEndpoints/UpstreamEndpoints';
import { MODEL_INTERFACE_TYPES } from '@/src/constants/deployment-interfaces';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialModelResource, DialModelResourceType } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getModelDeploymentId } from '@/src/utils/models/deployment-id';
import { supportsResponsesInterface } from '@/src/utils/models/responses-interface';
import Limits from '@/src/components/ModelView/Limits/Limits';
import Pricing from '@/src/components/ModelView/Pricing/Pricing';

interface Props {
  asset: DialModelResource;
  onChange: (asset: DialModelResource) => void;
}

const ModelAssetProperties: FC<Props> = ({ asset, onChange }) => {
  const t = useI18n();
  const showResponsesDefaults = supportsResponsesInterface(asset);

  return (
    <div className="flex flex-col">
      <ResourceInfoHeader
        entity={asset}
        postfix={
          <LabelledText
            label={t(EntityFieldsI18nKey.deploymentId)}
            text={getModelDeploymentId(asset.name)}
            tooltip={t(EntityFieldsI18nKey.deploymentIdTooltip)}
            copyable
          />
        }
      />
      <div className="flex flex-col gap-y-8 mt-8">
        <DisplayNameControl
          displayName={asset.displayName}
          required
          isFullWidth={false}
          onChange={(displayName) => onChange({ ...asset, displayName })}
        />
        {/*
         * Always optional and never checked for uniqueness: DIAL Core identifies a model resource by its
         * resource name, so two resources may carry the same display name and version. The entity
         * surfaces enforce a unique display-name/version pair because that is the admin BE's deployment
         * identity — a rule Core does not have, and one this surface must not invent.
         */}
        <VersionControl
          title={t(EntityFieldsI18nKey.displayVersion)}
          version={asset.displayVersion}
          optional
          isFullWidth={false}
          enableSemanticValidation={false}
          onChange={(displayVersion) => onChange({ ...asset, displayVersion })}
        />
        <DescriptionControl entity={asset} onChangeEntity={onChange} isFullWidth={false} />
        <IntroControl entity={asset} onChangeEntity={onChange} isFullWidth={false} />

        <IconControl iconUrl={asset.iconUrl} onChange={(iconUrl) => onChange({ ...asset, iconUrl })} />
        <TopicsControl entity={asset} onChange={onChange} view={ApplicationRoute.AssetsModels} />

        <ModelTypeControl entity={asset} onChangeEntity={onChange} />
        <OverrideNameControl entity={asset} onChangeEntity={onChange} />

        <InterfacesField entity={asset} onChangeEntity={onChange} allowedTypes={MODEL_INTERFACE_TYPES} isAsset />
        <EndpointControl
          id="endpoint"
          label={t(EntityFieldsI18nKey.endpoint)}
          placeholder={t(EntityPlaceholdersI18nKey.Endpoint)}
          caption={t(EntityFieldsI18nKey.endpointLegacyCaption)}
          endpoint={asset.endpoint}
          onChange={(endpoint) => onChange({ ...asset, endpoint })}
        />
        <UpstreamEndpoints
          entity={asset}
          onChangeEntity={onChange}
          isKeyOptional
          view={ApplicationRoute.AssetsModels}
          withResponses={showResponsesDefaults}
        />

        <EntityAttachments entity={asset} onChangeEntity={onChange} />
        <Defaults
          values={asset.defaults}
          onChangeValues={(defaults) => onChange({ ...asset, defaults })}
          title={t(EntityFieldsI18nKey.completionDefaults)}
        />
        {showResponsesDefaults && (
          <Defaults
            values={asset.responsesDefaults}
            onChangeValues={(responsesDefaults) => onChange({ ...asset, responsesDefaults })}
            title={t(EntityFieldsI18nKey.responsesDefaults)}
            validationKey="responsesDefaultKeys"
          />
        )}

        <TokenizerModelControl entity={asset} onChangeEntity={onChange} />
        <ForwardAuthTokenField view={ApplicationRoute.AssetsModels} entity={asset} onChangeEntity={onChange} />

        <MaxRetryAttempts entity={asset} onChangeEntity={onChange} />
        <Limits model={asset} onChangeModel={onChange} />
        {asset.type === DialModelResourceType.Embedding && (
          <EmbeddingDimensions model={asset} onChangeModel={onChange} />
        )}
        <Pricing model={asset} onChangeModel={onChange} />
      </div>
    </div>
  );
};

export default ModelAssetProperties;
