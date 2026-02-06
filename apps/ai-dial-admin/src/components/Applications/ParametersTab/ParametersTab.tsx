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
  entity?: DialApplication | DialApplicationResource;
  onChangeEntity?: (entity: BaseEntity, isSkipRefresh?: boolean) => void;
  applicationSchemes?: DialApplicationScheme[] | null;
  isJsonEditorEnabled?: boolean;
  view?: ApplicationRoute;
  isChanged?: boolean;
  isSkipRefresh?: boolean;
  onSave?: () => void;
  key?: number;
  setIsChanged?: Dispatch<SetStateAction<boolean>>;
  setSelectedEntity?: Dispatch<SetStateAction<BaseEntity>>;
}

const ApplicationParametersTab: FC<Props> = ({
  entity,
  onChangeEntity,
  applicationSchemes,
  isJsonEditorEnabled,
  view,
  isChanged,
  isSkipRefresh,
  onSave,
  key,
  setIsChanged,
  setSelectedEntity,
}) => {
  const t = useI18n();
  const { data: session } = useSession();
  const { currentTheme } = useTheme();
  const { dispatch } = useSaveValidationContext();
  const scheme = getAppRunner(entity as DialApplication, applicationSchemes);

  const [appPropertiesTemp, setAppPropertiesTemp] = useState<ApplicationPropertiesTemp[] | undefined>();
  const [schemeProperties, setSchemeProperties] = useState<ApplicationPropertiesTemp[]>([]);
  const [isAddClicked, setIsAddClicked] = useState(false);

  if (!scheme && !appPropertiesTemp) {
    setAppPropertiesTemp(convertAppPropertiesToArray(entity?.applicationProperties || {}));
  }

  const frameConfig = useMemo(() => {
    if (scheme) {
      return getFrameConfig(scheme, currentTheme, session as UserSession);
    } else if (entity?.editorUrl) {
      return getFrameConfig(entity, currentTheme, session as UserSession);
    }
    return null;
  }, [currentTheme, entity, scheme, session]);

  const targetUrl = useMemo(() => {
    const id =
      view === ApplicationRoute.AssetsApplications ? `applications/${(entity as AssetApp).path}` : entity?.name;
    try {
      const iframeUrl = `${frameConfig?.host}?authProvider=${frameConfig?.providerId}&theme=${frameConfig?.theme}&id=${id}`;
      return new URL(iframeUrl);
    } catch (error) {
      if (error) {
        return null;
      }
    }
  }, [entity, frameConfig, view]);

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
      if (entity?.applicationPropertiesTemp) {
        setAppPropertiesTemp(entity.applicationPropertiesTemp || []);
      } else {
        const schemeProps = convertJsonSchema(scheme as unknown as DialApplicationScheme, data);
        const appProperties = convertAppPropertiesToArray(entity?.applicationProperties || {}, schemeProps);
        setSchemeProperties(schemeProps);
        setAppPropertiesTemp(appProperties);
      }
    },
    [entity?.applicationProperties, entity?.applicationPropertiesTemp, scheme],
  );

  const onChangeProperties = useCallback(
    (props?: ApplicationPropertiesTemp[], isSkipRefresh?: boolean) => {
      const newEntity = {
        ...entity,
        applicationPropertiesTemp: props,
      } as unknown as BaseEntity;
      onChangeEntity?.(newEntity, isSkipRefresh);
      const isValid = !props?.some((p) => !p.key || p.value === void 0 || p.value === '');
      dispatch({ type: ValidationActionType.SetField, field: 'applicationProperties', isValid });
    },
    [dispatch, entity, onChangeEntity],
  );

  const onChangeConfiguration = useCallback(
    (data: Record<string, DefaultsValue>) => {
      if (paramsView === ParamsView.FORM) {
        const newEntity = {
          ...entity,
          applicationProperties: {
            ...data,
          },
        } as unknown as BaseEntity;
        onGetSchemeDefaults(data);
        onChangeEntity?.(newEntity);
      }
    },
    [entity, onChangeEntity, onGetSchemeDefaults, paramsView],
  );

  useEffect(() => {
    const properties =
      entity?.applicationPropertiesTemp ||
      convertAppPropertiesToArray(entity?.applicationProperties || {}, schemeProperties);
    setAppPropertiesTemp(properties);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity?.applicationPropertiesTemp, entity?.applicationProperties]);

  return (
    <div className="flex flex-col w-full h-full">
      {!isJsonEditorEnabled && (
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
        {paramsView !== ParamsView.UI && isJsonEditorEnabled && (
          <EntityJsonEditor
            key={key}
            entity={entity as BaseEntity}
            setSelectedEntity={setSelectedEntity as Dispatch<SetStateAction<BaseEntity>>}
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
            paramsView === ParamsView.FORM && !isJsonEditorEnabled ? 'block w-full h-full overflow-y-auto' : 'hidden',
          )}
        >
          {!scheme || !scheme?.properties || !Object.keys(scheme.properties).length ? (
            <DialNoDataContent title={t(EntitiesI18nKey.NoConfigurationSchema)} />
          ) : (
            <div className="flex-1 min-h-0 p-4 bg-layer-0">
              <SchemaUiRenderer
                schema={rjsfSchema}
                data={entity?.applicationProperties}
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
            isJsonEditorEnabled={isJsonEditorEnabled}
          />
        )}
      </div>
    </div>
  );
};

export default ApplicationParametersTab;
