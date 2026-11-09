import { FC, useCallback } from 'react';

import { Select } from '@epam/ai-dial-ui-kit';

import DecisionSettings from '@/src/components/Assets/Platform/Routers/DecisionSettings';
import { applyRouterMode, getRouterMode } from '@/src/components/Assets/Platform/Routers/utils';
import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import DescriptionControl from '@/src/components/BaseControls/Description';
import DisplayNameControl from '@/src/components/BaseControls/DisplayName';
import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import IconControl from '@/src/components/BaseControls/Icon';
import InterfacesField from '@/src/components/BaseControls/InterfacesField/InterfacesField';
import IntroControl from '@/src/components/BaseControls/Intro';
import MaxRetryAttempts from '@/src/components/BaseControls/MaxRetryAttempts';
import OverrideNameControl from '@/src/components/BaseControls/OverrideName';
import VersionControl from '@/src/components/BaseControls/Version';
import KeyValueGrid from '@/src/components/Common/KeyValueGrid/KeyValueGrid';
import CatalogSchemaField from '@/src/components/CatalogProperties/CatalogSchemaField';
import Defaults from '@/src/components/Defaults/Defaults';
import EntityAttachments from '@/src/components/EntityMainProperties/EntityAttachments/EntityAttachments';
import ForwardAuthTokenField from '@/src/components/EntityMainProperties/ForwardAuthToken/ForwardAuthTokenField';
import AppRunnersResource from '@/src/components/SourceField/Application/AppRunnersResource';
import { CATALOG_SCHEMA_PICKER_ENTITY_TYPE } from '@/src/constants/catalog-schemas';
import { ROUTER_INTERFACE_TYPES } from '@/src/constants/deployment-interfaces';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialRouterResource } from '@/src/models/dial/resource';
import { RouterMode } from '@/src/models/dial/router';
import type { CatalogSchemaOptions } from '@/src/server/catalog-schemas/read-options';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import { supportsResponsesInterface } from '@/src/utils/models/responses-interface';

interface Props {
  asset: DialRouterResource;
  translators?: ResourceInfo[];
  catalogSchemas?: CatalogSchemaOptions;
  schemes?: DialApplicationScheme[];
  onChange: (asset: DialRouterResource) => void;
}

const RouterAssetProperties: FC<Props> = ({ asset, translators, catalogSchemas, schemes, onChange }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const mode = getRouterMode(asset);
  const isDecision = mode === RouterMode.Decision;

  const modeOptions = [
    { value: RouterMode.Proxy, label: t(EntityFieldsI18nKey.routerModeProxy) },
    { value: RouterMode.Decision, label: t(EntityFieldsI18nKey.routerModeDecision) },
  ];

  const onChangeMode = useCallback(
    (value: string | string[]) => onChange(applyRouterMode(asset, value as RouterMode)),
    [asset, onChange],
  );

  // Core requires the pair together (and 502s a request whose properties stopped matching the schema), so a
  // pick seeds the schema's defaults and a clear removes both fields.
  const onChangeSchema = useCallback(
    (applicationTypeSchemaId?: string, defaults?: Record<string, unknown>) =>
      onChange({
        ...asset,
        applicationTypeSchemaId,
        applicationProperties: applicationTypeSchemaId ? { ...defaults, ...asset.applicationProperties } : undefined,
      }),
    [asset, onChange],
  );

  return (
    <div className="flex flex-col">
      <ResourceInfoHeader entity={asset} />
      <div className="flex flex-col gap-y-8 mt-8">
        <DisplayNameControl
          displayName={asset.displayName}
          isFullWidth={false}
          onChange={(displayName) => onChange({ ...asset, displayName })}
        />
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
        <OverrideNameControl entity={asset} onChangeEntity={onChange} />

        <Select
          id="routerMode"
          labelProps={{ label: t(EntityFieldsI18nKey.routerMode) }}
          fieldClassName="w-[220px]"
          className="w-[220px]"
          options={modeOptions}
          value={mode}
          disabled={isReadOnlyAdmin}
          onChange={onChangeMode}
        />
        {isDecision && (
          <DecisionSettings decision={asset.decision} onChange={(decision) => onChange({ ...asset, decision })} />
        )}

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
          allowedTypes={ROUTER_INTERFACE_TYPES}
          translators={translators}
          entityBaseUrl={asset.baseUrl}
          isTranslatorDisabled={isDecision}
          view={ApplicationRoute.PlatformRouters}
          isAsset
        />

        <AppRunnersResource
          label={t(EntityFieldsI18nKey.routerAppRunner)}
          selectedValue={asset.applicationTypeSchemaId}
          onChangeValue={onChangeSchema}
          runners={schemes}
          isOptional
          isPopup
        />

        <EntityAttachments entity={asset} onChangeEntity={onChange} />
        <Defaults
          values={asset.defaults}
          onChangeValues={(defaults) => onChange({ ...asset, defaults })}
          title={t(EntityFieldsI18nKey.completionDefaults)}
        />
        {supportsResponsesInterface(asset) && (
          <Defaults
            values={asset.responsesDefaults}
            onChangeValues={(responsesDefaults) => onChange({ ...asset, responsesDefaults })}
            title={t(EntityFieldsI18nKey.responsesDefaults)}
            validationKey="responsesDefaultKeys"
          />
        )}
        <KeyValueGrid
          label={t(EntityFieldsI18nKey.defaultHeaders)}
          value={asset.defaultHeaders}
          onChange={(defaultHeaders) => onChange({ ...asset, defaultHeaders })}
        />

        <ForwardAuthTokenField view={ApplicationRoute.PlatformRouters} entity={asset} onChangeEntity={onChange} />
        <MaxRetryAttempts entity={asset} onChangeEntity={onChange} />
        <CatalogSchemaField
          schemaId={asset.catalogSchemaId}
          options={catalogSchemas?.options}
          optionsError={catalogSchemas?.error}
          entityType={CATALOG_SCHEMA_PICKER_ENTITY_TYPE.models}
          onChange={(catalogSchemaId) => onChange({ ...asset, catalogSchemaId, catalogProperties: void 0 })}
        />
      </div>
    </div>
  );
};

export default RouterAssetProperties;
