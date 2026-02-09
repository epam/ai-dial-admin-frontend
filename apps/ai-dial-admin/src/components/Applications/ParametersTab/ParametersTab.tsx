'use client';

import { useSession } from 'next-auth/react';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { DialNoDataContent, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { RJSFSchema } from '@rjsf/utils';
import { IconPlus } from '@tabler/icons-react';
import classNames from 'classnames';

import {
  convertAppPropertiesToArray,
  convertJsonSchema,
  generateViewItems,
  getAppRunner,
  getFrameConfig,
  getInitialParamsView,
} from '@/src/components/Applications/ParametersTab/utils';
import SchemaUiRenderer from '@/src/components/Common/SchemaUIRenderer/SchemaUIRenderer';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import FrameRenderer from '@/src/components/FrameRenderer/FrameRenderer';
import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useI18n } from '@/src/locales/client';
import { UserSession } from '@/src/models/auth';
import { ApplicationPropertiesTemp, DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/application-resource';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DefaultsValue } from '@/src/models/dial/defaults';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { ParamsView } from '@/src/types/parameters';
import { ApplicationRoute } from '@/src/types/routes';
import TableView from './TableView';
import ViewControl from './ViewControl';

interface Props {
  application?: DialApplication | DialApplicationResource;
  applicationSchemes?: DialApplicationScheme[] | null;
  isEditorEnabled?: boolean;
  view?: ApplicationRoute;
  isChanged?: boolean;
  isSkipRefresh?: boolean;
  setIsChanged?: Dispatch<SetStateAction<boolean>>;
  setSelectedApplication?: Dispatch<SetStateAction<DialApplication | DialApplicationResource>>;
  onSave?: () => void;
  onChange?: (application: DialApplication | DialApplicationResource, isSkipRefresh?: boolean) => void;
}

const ParametersTab: FC<Props> = ({
  application,
  onChange,
  applicationSchemes,
  isEditorEnabled,
  view,
  isChanged,
  isSkipRefresh,
  onSave,
  setIsChanged,
  setSelectedApplication,
}) => {
  const t = useI18n();
  const { data: session } = useSession();
  const { currentTheme } = useTheme();
  const { dispatch } = useSaveValidationContext();
  const scheme = getAppRunner(application as DialApplication, applicationSchemes);

  const [appPropertiesTemp, setAppPropertiesTemp] = useState<ApplicationPropertiesTemp[] | undefined>();
  const [schemeProperties, setSchemeProperties] = useState<ApplicationPropertiesTemp[]>([]);
  const [isAddClicked, setIsAddClicked] = useState(false);

  if (!scheme && !appPropertiesTemp) {
    setAppPropertiesTemp(convertAppPropertiesToArray(application?.applicationProperties || {}));
  }

  const frameConfig = useMemo(() => {
    if (scheme) {
      return getFrameConfig(scheme, currentTheme, session as UserSession);
    } else if (application?.editorUrl) {
      return getFrameConfig(application, currentTheme, session as UserSession);
    }
    return null;
  }, [currentTheme, application, scheme, session]);

  const targetUrl = useMemo(() => {
    const id =
      view === ApplicationRoute.AssetsApplications
        ? `applications/${(application as AssetApp).path}`
        : application?.name;
    try {
      const iframeUrl = `${frameConfig?.host}?authProvider=${frameConfig?.providerId}&theme=${frameConfig?.theme}&id=${id}`;
      return new URL(iframeUrl);
    } catch (error) {
      if (error) {
        return null;
      }
    }
  }, [application, frameConfig, view]);

  const rjsfSchema = useMemo(
    () =>
      ({
        $defs: scheme?.$defs,
        properties: scheme?.properties,
        required: scheme?.required,
        isRoot: true,
      }) as RJSFSchema,
    [scheme],
  );

  const viewItems = generateViewItems(t, view, !!targetUrl, !!frameConfig);
  const [paramsView, setParamsView] = useState(getInitialParamsView(view, !!targetUrl));

  const showDropdown = useMemo(() => {
    return viewItems.length > 1;
  }, [viewItems.length]);

  const onGetSchemeDefaults = useCallback(
    (data: Record<string, DefaultsValue>) => {
      if (application?.applicationPropertiesTemp) {
        setAppPropertiesTemp(application.applicationPropertiesTemp || []);
      } else {
        const schemeProps = convertJsonSchema(scheme as unknown as DialApplicationScheme, data);
        const appProperties = convertAppPropertiesToArray(application?.applicationProperties || {}, schemeProps);
        setSchemeProperties(schemeProps);
        setAppPropertiesTemp(appProperties);
      }
    },
    [application?.applicationProperties, application?.applicationPropertiesTemp, scheme],
  );

  const onChangeProperties = useCallback(
    (props?: ApplicationPropertiesTemp[], isSkipRefresh?: boolean) => {
      const newEntity = {
        ...application,
        applicationPropertiesTemp: props,
      } as unknown as BaseEntity;
      onChange?.(newEntity, isSkipRefresh);
      const isValid = !props?.some((p) => !p.key || p.value === void 0 || p.value === '');
      dispatch({ type: ValidationActionType.SetField, field: 'applicationProperties', isValid });
    },
    [dispatch, application, onChange],
  );

  const onChangeConfiguration = useCallback(
    (data: Record<string, DefaultsValue>) => {
      if (paramsView === ParamsView.FORM) {
        const newEntity = {
          ...application,
          applicationProperties: {
            ...data,
          },
        } as unknown as BaseEntity;
        onGetSchemeDefaults(data);
        onChange?.(newEntity);
      }
    },
    [application, onChange, onGetSchemeDefaults, paramsView],
  );

  useEffect(() => {
    const properties =
      application?.applicationPropertiesTemp ||
      convertAppPropertiesToArray(application?.applicationProperties || {}, schemeProperties);
    setAppPropertiesTemp(properties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.applicationPropertiesTemp, application?.applicationProperties]);

  return (
    <div className="flex flex-col w-full h-full">
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
            {paramsView === ParamsView.TABLE && (
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
        {paramsView !== ParamsView.UI && isEditorEnabled && (
          <EntityJsonEditor
            entity={application as BaseEntity}
            setSelectedEntity={setSelectedApplication}
            setIsChanged={setIsChanged}
          />
        )}
        {paramsView === ParamsView.TABLE && (
          <TableView
            isAddClicked={isAddClicked}
            setIsAddClicked={setIsAddClicked}
            properties={appPropertiesTemp || []}
            onChangeProperties={onChangeProperties}
            isSkipRefresh={isSkipRefresh}
          />
        )}
        <div
          className={classNames(
            paramsView === ParamsView.FORM && !isEditorEnabled ? 'block w-full h-full overflow-y-auto' : 'hidden',
          )}
        >
          {!scheme || !scheme?.properties || !Object.keys(scheme.properties).length ? (
            <DialNoDataContent title={t(EntitiesI18nKey.NoConfigurationSchema)} />
          ) : (
            <div className="flex-1 min-h-0 p-4 bg-layer-0">
              <SchemaUiRenderer
                schema={rjsfSchema}
                data={application?.applicationProperties}
                onChangeConfiguration={onChangeConfiguration}
                onGetSchemeDefaults={onGetSchemeDefaults}
                readonly={
                  view === ApplicationRoute.ApplicationPublications || view === ApplicationRoute.ApplicationRunners
                }
              />
            </div>
          )}
        </div>
        {paramsView === ParamsView.UI && (
          <FrameRenderer
            iframeUrl={targetUrl?.href ?? ''}
            name={frameConfig?.name}
            isJsonEditorEnabled={isEditorEnabled}
          />
        )}
      </div>
    </div>
  );
};

export default ParametersTab;
