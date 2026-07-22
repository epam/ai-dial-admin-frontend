'use client';

import { useSession } from 'next-auth/react';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { DialLoader, DialNoDataContent, DialPrimaryButton, JsonSchema, SelectOption } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import {
  convertJsonSchema,
  generateViewItems,
  getAppRunner,
  getCorrectConfig,
  getInitialParamsView,
  getTargetUrl,
} from '@/src/components/Applications/ParametersTab/utils';
import { getResolvedApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import SchemaUiRenderer from '@/src/components/Common/SchemaUIRenderer/SchemaUIRenderer';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import FrameRenderer from '@/src/components/FrameRenderer/FrameRenderer';
import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { UserSession } from '@/src/models/auth';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/resource';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ParamsView } from '@/src/types/parameters';
import { ApplicationRoute } from '@/src/types/routes';
import TableView from './TableView';
import ViewControl from './ViewControl';
import { AssetApp } from '@/src/models/dial/deployment-asset';

interface Props {
  application?: DialApplication | DialApplicationResource;
  applicationSchemes?: DialApplicationScheme[] | null;
  isEditorEnabled?: boolean;
  view?: ApplicationRoute;
  isChanged?: boolean;
  discardKey?: number;
  setIsChanged?: Dispatch<SetStateAction<boolean>>;
  setSelectedApplication?: Dispatch<SetStateAction<DialApplication>>;
  onSave?: () => void;
  onChange?: (application: DialApplication, isSkipRefresh?: boolean) => void;
}

const ParametersTab: FC<Props> = ({
  application,
  onChange,
  applicationSchemes,
  isEditorEnabled,
  view,
  isChanged,
  discardKey,
  onSave,
  setIsChanged,
  setSelectedApplication,
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { data: session } = useSession();
  const { currentTheme } = useTheme();
  const { dispatch } = useSaveValidationContext();
  const [scheme, setScheme] = useState<DialApplicationScheme | undefined>(undefined);
  const [isSchemeLoading, setIsSchemeLoading] = useState(true);

  const [viewItems, setViewItems] = useState<SelectOption[]>([]);
  const [paramsView, setParamsView] = useState<ParamsView>(ParamsView.TABLE);
  const [isAddClicked, setIsAddClicked] = useState(false);

  useEffect(() => {
    let scheme = undefined;
    const foundRunner = getAppRunner(application as DialApplication, applicationSchemes, view);
    setIsSchemeLoading(true);
    getResolvedApplicationScheme(foundRunner?.$id ?? '').then((res) => {
      if (res.success && (res.response as { schema?: DialApplicationScheme })?.schema) {
        scheme = (res.response as { schema: DialApplicationScheme }).schema;
      } else {
        scheme = foundRunner ?? undefined;
      }
      setIsSchemeLoading(false);
      setScheme(scheme);
      const config = getCorrectConfig(scheme, application, currentTheme, session as UserSession);
      const targetUrl = getTargetUrl(view, application, config);

      setViewItems(generateViewItems(t, view, !!targetUrl && !isReadOnlyAdmin, !!config));
      setParamsView(getInitialParamsView(view, !!targetUrl && !isReadOnlyAdmin));
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(application as AssetApp)?.version]);

  const schemeProperties = useMemo(() => {
    if (!scheme?.properties) return [];
    return convertJsonSchema(scheme as DialApplicationScheme, {});
  }, [scheme]);

  const frameConfig = useMemo(() => {
    return getCorrectConfig(scheme, application, currentTheme, session as UserSession);
  }, [currentTheme, application, scheme, session]);

  const targetUrl = useMemo(() => {
    return getTargetUrl(view, application, frameConfig);
  }, [application, frameConfig, view]);

  const applicationProperties = useMemo(() => {
    return view === ApplicationRoute.AssetsApplications
      ? (application as DialApplicationResource)?.application_properties || {}
      : (application as DialApplication)?.applicationProperties || {};
  }, [application, view]);

  const jsonSchema = useMemo(
    () =>
      ({
        $defs: scheme?.$defs,
        properties: scheme?.properties,
        required: scheme?.required,
        isRoot: true,
      }) as JsonSchema,
    [scheme],
  );

  const showDropdown = useMemo(() => {
    return viewItems.length > 1;
  }, [viewItems.length]);

  const acceptableResourceTypes = useMemo(() => {
    const externalServices = (application as DialApplicationResource)?.external_services;
    return { external_services: externalServices ? Object.keys(externalServices) : [] };
  }, [application]);

  const onGetSchemeDefaults = useCallback((_data: Record<string, unknown>) => {}, []);

  const onChangeProperties = useCallback(
    (props: Record<string, unknown>) => {
      const newEntity = {
        ...application,
        ...(view === ApplicationRoute.AssetsApplications
          ? { application_properties: props }
          : { applicationProperties: props }),
      } as unknown as BaseEntity;
      onChange?.(newEntity);
    },
    [application, onChange, view],
  );

  const onValidityChange = useCallback(
    (isValid: boolean) => {
      dispatch({ type: ValidationActionType.SetField, field: 'applicationProperties', isValid });
    },
    [dispatch],
  );

  const onChangeConfiguration = useCallback(
    (data: Record<string, unknown>) => {
      if (paramsView === ParamsView.FORM) {
        const newEntity = {
          ...application,
          applicationProperties: {
            ...data,
          },
        } as unknown as BaseEntity;
        onChange?.(newEntity);
      }
    },
    [application, onChange, paramsView],
  );

  return (
    <div className="flex flex-col size-full">
      {!isEditorEnabled && (
        <div className="flex flex-row justify-between mb-2">
          <div className="flex flex-row gap-4 items-center">
            <h1>{t(TabsI18nKey.Parameters)}</h1>
            {showDropdown && (
              <ViewControl
                items={viewItems}
                paramsView={paramsView}
                setParamsView={setParamsView}
                isChanged={isChanged}
                onSave={onSave}
              />
            )}
          </div>
          <div className="flex flex-row gap-4">
            {paramsView === ParamsView.TABLE && !isReadOnlyAdmin && (
              <DialPrimaryButton
                iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
                label={t(ButtonsI18nKey.Add)}
                onClick={() => setIsAddClicked(true)}
              />
            )}
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0">
        {isSchemeLoading ? (
          <DialLoader size={40} />
        ) : (
          <>
            {paramsView !== ParamsView.UI && isEditorEnabled && (
              <EntityJsonEditor
                key={discardKey}
                entity={application as BaseEntity}
                setSelectedEntity={setSelectedApplication}
                setIsChanged={setIsChanged}
              />
            )}
            {paramsView === ParamsView.TABLE && !isEditorEnabled && (
              <TableView
                key={discardKey}
                applicationProperties={applicationProperties}
                schemeProperties={schemeProperties}
                onChangeProperties={onChangeProperties}
                onValidityChange={onValidityChange}
                isAddClicked={isAddClicked}
                setIsAddClicked={setIsAddClicked}
                disabled={isReadOnlyAdmin}
              />
            )}
            {paramsView === ParamsView.FORM && !isEditorEnabled && (
              <div className="size-full overflow-y-auto">
                {!scheme || !scheme?.properties || !Object.keys(scheme.properties).length ? (
                  <DialNoDataContent title={t(EntitiesI18nKey.NoConfigurationSchema)} />
                ) : (
                  <div className="flex-1 min-h-0 p-4 bg-layer-0">
                    <SchemaUiRenderer
                      schema={jsonSchema}
                      data={applicationProperties}
                      onChangeConfiguration={onChangeConfiguration}
                      onGetSchemeDefaults={onGetSchemeDefaults}
                      disabled={view === ApplicationRoute.ApplicationPublications}
                      defaultExpanded={false}
                      acceptableResourceTypes={acceptableResourceTypes}
                    />
                  </div>
                )}
              </div>
            )}
            {paramsView === ParamsView.UI && (
              <FrameRenderer
                iframeUrl={targetUrl?.href ?? ''}
                name={frameConfig?.name}
                isJsonEditorEnabled={isEditorEnabled}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ParametersTab;
