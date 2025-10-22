'use client';

import { useSession } from 'next-auth/react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { ButtonVariant, DialButton, DialNoDataContent } from '@epam/ai-dial-ui-kit';
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
import FrameRenderer from '@/src/components/FrameRenderer/FrameRenderer';
import { ButtonsI18nKey, EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useTheme } from '@/src/context/ThemeContext';
import { useI18n } from '@/src/locales/client';
import { UserSession } from '@/src/models/auth';
import { ApplicationPropertiesTemp, DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialApplicationResource } from '@/src/models/dial/application-resource';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DefaultsValue } from '@/src/models/dial/defaults';
import { ApplicationRoute } from '@/src/types/routes';
import TableView from './TableView';
import ViewControl from './ViewControl';
import { ParamsView } from './types';

interface Props {
  entity?: DialApplication | DialApplicationResource;
  onChangeEntity?: (entity: BaseEntity, isSkipRefresh?: boolean) => void;
  applicationSchemes?: DialApplicationScheme[] | null;
  jsonEditorEnabled?: boolean;
  view?: ApplicationRoute;
  isChanged?: boolean;
  isSkipRefresh?: boolean;
  onSave?: () => void;
}

const ApplicationParametersTab: FC<Props> = ({
  entity,
  onChangeEntity,
  applicationSchemes,
  jsonEditorEnabled,
  view,
  isChanged,
  isSkipRefresh,
  onSave,
}) => {
  const t = useI18n() as (s: string) => string;
  const { data: session } = useSession();
  const { currentTheme } = useTheme();
  const scheme = getAppRunner(entity as DialApplication, applicationSchemes);

  const [appPropertiesTemp, setAppPropertiesTemp] = useState<ApplicationPropertiesTemp[] | undefined>();
  const [schemeProperties, setSchemeProperties] = useState<ApplicationPropertiesTemp[]>([]);

  if (!scheme && !appPropertiesTemp) {
    setAppPropertiesTemp(convertAppPropertiesToArray(entity?.applicationProperties || {}));
  }

  const frameConfig = useMemo(() => {
    if (scheme) {
      return getFrameConfig(scheme, currentTheme, session as UserSession);
    }
    return null;
  }, [currentTheme, scheme, session]);

  const targetUrl = useMemo(() => {
    try {
      const iframeUrl = `${frameConfig?.host}?authProvider=${frameConfig?.providerId}&theme=${frameConfig?.theme}&id=${entity?.name}`;
      return new URL(iframeUrl);
    } catch (error) {
      if (error) {
        return null;
      }
    }
  }, [entity, frameConfig]);

  const viewItems = generateViewItems(t, view, !!targetUrl, !!frameConfig);
  const [paramsView, setParamsView] = useState(getInitialParamsView(view, !!targetUrl));

  const showDropdown = useMemo(() => {
    return viewItems.length > 1;
  }, [viewItems.length]);

  const onAddProperty = useCallback(() => {
    const newProperty = {
      key: '',
      value: '',
      type: 'string',
      required: false,
      isFromScheme: false,
    };
    const newEntity = {
      ...entity,
      applicationPropertiesTemp: [...(appPropertiesTemp || []), newProperty],
    } as unknown as BaseEntity;
    onChangeEntity?.(newEntity, false);
  }, [appPropertiesTemp, entity, onChangeEntity]);

  const onChangeProperties = useCallback(
    (props?: ApplicationPropertiesTemp[], isSkipRefresh?: boolean) => {
      const newEntity = {
        ...entity,
        applicationPropertiesTemp: props,
      } as unknown as BaseEntity;
      onChangeEntity?.(newEntity, isSkipRefresh);
    },
    [entity, onChangeEntity],
  );

  const onChangeConfiguration = useCallback(
    (data: Record<string, unknown>) => {
      if (paramsView === ParamsView.FORM) {
        const newEntity = {
          ...entity,
          applicationProperties: {
            ...data,
          },
        } as unknown as BaseEntity;
        onChangeEntity?.(newEntity);
      }
    },
    [entity, onChangeEntity, paramsView],
  );

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

  useEffect(() => {
    setAppPropertiesTemp(
      entity?.applicationPropertiesTemp ||
        convertAppPropertiesToArray(entity?.applicationProperties || {}, schemeProperties),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity?.applicationPropertiesTemp, entity?.applicationProperties]);

  return (
    <div className="flex flex-col w-full h-full pt-5">
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
            <DialButton
              variant={ButtonVariant.Primary}
              iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
              title={t(ButtonsI18nKey.Add)}
              onClick={() => onAddProperty()}
            />
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {paramsView === ParamsView.TABLE && (
          <TableView
            properties={appPropertiesTemp || []}
            onChangeProperties={onChangeProperties}
            isSkipRefresh={isSkipRefresh}
          />
        )}
        <div className={classNames(paramsView === ParamsView.FORM ? 'block w-full h-full' : 'hidden')}>
          {!scheme || !scheme?.properties || !Object.keys(scheme.properties).length ? (
            <DialNoDataContent title={t(EntitiesI18nKey.NoConfigurationSchema)} />
          ) : (
            <SchemaUiRenderer
              schema={scheme as RJSFSchema}
              data={entity?.applicationProperties}
              onChangeConfiguration={onChangeConfiguration}
              onGetSchemeDefaults={onGetSchemeDefaults}
            />
          )}
        </div>
        {paramsView === ParamsView.UI && (
          <FrameRenderer
            iframeUrl={targetUrl?.href ?? ''}
            name={frameConfig?.name}
            jsonEditorEnabled={jsonEditorEnabled}
          />
        )}
      </div>
    </div>
  );
};

export default ApplicationParametersTab;
