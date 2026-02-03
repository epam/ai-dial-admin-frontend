'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AlertVariant, DialAlert, DialNoDataContent, DialTabs, TabModel } from '@epam/ai-dial-ui-kit';
import { IconWorldStar } from '@tabler/icons-react';
import { cloneDeep } from 'lodash';

import {
  getCoreInterceptor,
  removeInterceptor,
  updateCoreInterceptor,
  updateInterceptor,
} from '@/src/app/[lang]/interceptors/actions';
import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import {
  getRelevantAppRunnersForInterceptor,
  getRelevantDataForInterceptor,
} from '@/src/components/AddEntitiesTab/utils';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import ParameterSchema from '@/src/components/Interceptors/View/ParameterSchema/ParameterSchema';
import { RUNNERS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, InterceptorsI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DefaultsValue } from '@/src/models/dial/defaults';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { InterceptorTemplate } from '@/src/models/interceptor-template';
import { ExportFormat } from '@/src/types/export';
import { InterceptorStatus } from '@/src/types/interceptor-status';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getInterceptorTabs } from '@/src/utils/tabs/utils';
import InterceptorProperties from './Properties';
import { getViewHeaderClassName } from '@/src/utils/entities/view';

interface Props {
  originalInterceptor: DialInterceptor;
  names: string[];
  etag: string;
  models: DialModel[];
  applications: DialApplication[];
  interceptorTemplate?: InterceptorTemplate | null;
  appRunners: DialApplicationScheme[];
}

const InterceptorView: FC<Props> = ({
  originalInterceptor,
  names,
  models,
  etag,
  applications,
  interceptorTemplate,
  appRunners,
}) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const tabs: TabModel[] = getInterceptorTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedInterceptor, setSelectedInterceptor] = useState(cloneDeep(originalInterceptor));
  const [isChanged, setIsChanged] = useState(false);
  const [isJsonEditorEnabled, setIsJsonEditorEnabled] = useState(false);
  const [key, setKey] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState(ExportFormat.ADMIN);
  const [coreInterceptor, setCoreInterceptor] = useState<DialInterceptor | null>(null);

  const showGlobalError = useMemo(() => {
    return originalInterceptor.status === InterceptorStatus.GLOBAL;
  }, [originalInterceptor.status]);

  useEffect(() => {
    const name = originalInterceptor?.name;
    if (!coreInterceptor && name) {
      getReqRef.current(getCoreInterceptor, name).then((data) => {
        setCoreInterceptor(data.response);
      });
    }
  }, [coreInterceptor, originalInterceptor]);

  useEffect(() => {
    setSelectedInterceptor(
      selectedFormat === ExportFormat.CORE
        ? cloneDeep(coreInterceptor as DialInterceptor)
        : cloneDeep(originalInterceptor),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, originalInterceptor]);

  useEffect(() => {
    const isEqualAdminInterceptor = isEqualSkippingUndefined(originalInterceptor, selectedInterceptor);
    const isEqualCoreInterceptor = isEqualSkippingUndefined(selectedInterceptor, coreInterceptor);

    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreInterceptor : !isEqualAdminInterceptor);
  }, [selectedFormat, originalInterceptor, selectedInterceptor, coreInterceptor]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onDiscard = useCallback(() => {
    if (isJsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      setSelectedFormat(ExportFormat.ADMIN);
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    dispatch({ type: ValidationActionType.Reset });
    setSelectedInterceptor(originalInterceptor);
  }, [isJsonEditorEnabled, originalInterceptor, dispatch]);

  const onChangeInterceptor = useCallback(
    (entity: DialInterceptor) => {
      setSelectedInterceptor(entity);
    },
    [setSelectedInterceptor],
  );

  const onToggleJsonEditor = useCallback(() => {
    setSelectedFormat(ExportFormat.ADMIN);
    setIsJsonEditorEnabled((prev) => !prev);
  }, [setIsJsonEditorEnabled]);

  const onAddEntities = useCallback(
    (rows: EntitiesGridData[]) => {
      const newEntities = rows.map((row) => row.name as string);
      onChangeInterceptor({
        ...selectedInterceptor,
        entities: [...(selectedInterceptor.entities || []), ...newEntities],
      });
    },
    [onChangeInterceptor, selectedInterceptor],
  );

  const onRemoveEntity = useCallback(
    (row: EntitiesGridData) => {
      const newInterceptor = cloneDeep(selectedInterceptor);
      newInterceptor.entities = newInterceptor.entities?.filter((entity) => entity !== row.name);
      onChangeInterceptor(newInterceptor);
    },
    [onChangeInterceptor, selectedInterceptor],
  );

  const onAddRunner = useCallback(
    (rows: EntitiesGridData[]) => {
      const newRunners = rows.map((row) => row.$id as string);
      onChangeInterceptor({
        ...selectedInterceptor,
        applicationTypeSchemas: [...(selectedInterceptor.applicationTypeSchemas || []), ...newRunners],
      });
    },
    [onChangeInterceptor, selectedInterceptor],
  );

  const onRemoveRunner = useCallback(
    (row: EntitiesGridData) => {
      const newInterceptor = cloneDeep(selectedInterceptor);
      newInterceptor.applicationTypeSchemas = newInterceptor.applicationTypeSchemas?.filter(
        (runner) => runner !== row.$id,
      );
      onChangeInterceptor(newInterceptor);
    },
    [onChangeInterceptor, selectedInterceptor],
  );

  const onSave = useCallback(() => {
    const req =
      selectedFormat === ExportFormat.CORE
        ? getReqRef.current(
            updateCoreInterceptor,
            selectedInterceptor as Record<string, unknown>,
            originalInterceptor.name || '',
            etag,
          )
        : getReqRef.current(updateInterceptor, selectedInterceptor, etag);

    req.then((res) => {
      if (res.success) {
        dispatch({ type: ValidationActionType.Reset });
        setCoreInterceptor(null);
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Interceptors, t),
            getUpdateNotificationDescription(ApplicationRoute.Interceptors, selectedInterceptor.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedFormat, selectedInterceptor, originalInterceptor.name, etag, dispatch, showNotification, t, router]);

  const onChangeConfiguration = useCallback(
    (data: Record<string, unknown>) => {
      const newInterceptor = {
        ...selectedInterceptor,
        defaults: {
          ...selectedInterceptor.defaults,
          custom_fields: {
            interceptor_configuration: data,
          },
        },
      };
      onChangeInterceptor(newInterceptor);
    },
    [onChangeInterceptor, selectedInterceptor],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={getViewHeaderClassName(isJsonEditorEnabled)}>
        {!isJsonEditorEnabled && (
          <div className="flex-1 min-w-0">
            <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
          </div>
        )}
        <HeaderButtons
          view={ApplicationRoute.Interceptors}
          entity={selectedInterceptor}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onSave}
          onRemove={removeInterceptor}
          isEditorEnabled={isJsonEditorEnabled}
          onToggleEditor={onToggleJsonEditor}
          selectedFormat={selectedFormat}
          onChangeSelectedFormat={setSelectedFormat}
        />
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        {isJsonEditorEnabled ? (
          <EntityJsonEditor
            key={key}
            entity={selectedInterceptor}
            setSelectedEntity={setSelectedInterceptor}
            setIsChanged={setIsChanged}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && (
              <>
                <EntityHeader entity={selectedInterceptor} view={ApplicationRoute.Interceptors} />
                <div className="flex-1 min-h-0 pt-8">
                  <InterceptorProperties
                    selectedInterceptor={selectedInterceptor}
                    onChangeInterceptor={onChangeInterceptor}
                    names={names}
                  />
                </div>
              </>
            )}
            {activeTab === EntityViewTab.ParameterSchema && (
              <ParameterSchema
                configuration={
                  selectedInterceptor.defaults?.custom_fields?.['interceptor_configuration' as keyof DefaultsValue]
                }
                onChangeConfiguration={onChangeConfiguration}
                schemaURL={
                  selectedInterceptor.features?.configurationEndpoint || interceptorTemplate?.configurationEndpoint
                }
                name={selectedInterceptor.name as string}
              />
            )}
            {activeTab === EntityViewTab.ApplicationRunners && (
              <AddEntitiesView
                viewTitle={t(TabsI18nKey.ApplicationRunners)}
                customColumns={RUNNERS_COLUMNS}
                modalTitle={t(EntitiesI18nKey.AddApplicationRunner)}
                emptyDataTitle={t(EntitiesI18nKey.NoApplicationRunners)}
                appRunners={appRunners}
                onAdd={onAddRunner}
                onRemove={onRemoveRunner}
                getRelevantDataForEntity={getRelevantAppRunnersForInterceptor.bind(this, selectedInterceptor)}
              />
            )}
            {activeTab === EntityViewTab.Entities &&
              (showGlobalError ? (
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <DialNoDataContent
                      icon={<IconWorldStar strokeWidth={1} size={60} />}
                      title={t(InterceptorsI18nKey.GlobalMessage)}
                    />
                  </div>
                  <DialAlert variant={AlertVariant.Info} message={t(InterceptorsI18nKey.GlobalAlert)} />
                </div>
              ) : (
                <AddEntitiesView
                  models={models}
                  applications={applications}
                  onAdd={onAddEntities}
                  onRemove={onRemoveEntity}
                  getRelevantDataForEntity={getRelevantDataForInterceptor.bind(this, selectedInterceptor)}
                />
              ))}
            {activeTab === EntityViewTab.Audit && (
              <EntityAudit entity={originalInterceptor} view={ApplicationRoute.Interceptors} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InterceptorView;
