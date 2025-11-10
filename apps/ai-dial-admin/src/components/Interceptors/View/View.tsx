'use client';

import classNames from 'classnames';
import { cloneDeep } from 'lodash';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';
import { DialTabs, TabModel } from '@epam/ai-dial-ui-kit';

import {
  removeInterceptor,
  updateInterceptor,
  getCoreInterceptor,
  updateCoreInterceptor,
} from '@/src/app/[lang]/interceptors/actions';
import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import { getRelevantDataForInterceptor } from '@/src/components/AddEntitiesTab/utils';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { auditTabs, EntityViewTab, parameterSchemaTabs, propertiesTabs } from '@/src/components/EntityView/View/utils';
import ParameterSchema from '@/src/components/Interceptors/View/ParameterSchema/ParameterSchema';
import { TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { DefaultsValue } from '@/src/models/dial/defaults';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import InterceptorProperties from './Properties';

interface Props {
  originalInterceptor: DialInterceptor;
  names: string[];
  etag: string;
  models: DialModel[];
  applications: DialApplication[];
}

const InterceptorView: FC<Props> = ({ originalInterceptor, names, models, etag, applications }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();

  const tabs: TabModel[] = [
    propertiesTabs(t),
    parameterSchemaTabs(t),
    { id: EntityViewTab.Entities, name: t(TabsI18nKey.Entities) },
    auditTabs(t),
  ];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedInterceptor, setSelectedInterceptor] = useState(cloneDeep(originalInterceptor));
  const [isChanged, setIsChanged] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [key, setKey] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.ADMIN);
  const [coreInterceptor, setCoreInterceptor] = useState<DialInterceptor | null>(null);

  useEffect(() => {
    const name = originalInterceptor?.name;
    if (!coreInterceptor && name) {
      getCoreInterceptor(name).then((data) => {
        setCoreInterceptor(data.response as DialInterceptor);
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

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

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
    if (jsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      setSelectedFormat(ExportFormat.ADMIN);
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedInterceptor(originalInterceptor);
  }, [jsonEditorEnabled, originalInterceptor, dispatch]);

  const onChangeInterceptor = useCallback(
    (entity: DialInterceptor) => {
      setSelectedInterceptor(entity);
    },
    [setSelectedInterceptor],
  );

  const toggleJsonEditor = useCallback(() => {
    setSelectedFormat(ExportFormat.ADMIN);
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const onAddEntities = useCallback(
    (rows: EntitiesGridData[]) => {
      const newEntities = rows.map((row) => row.name as string);
      const newInterceptor = {
        ...selectedInterceptor,
        entities: [...(selectedInterceptor.entities || []), ...newEntities],
      };
      onChangeInterceptor(newInterceptor);
    },
    [onChangeInterceptor, selectedInterceptor],
  );

  const onRemoveEntity = useCallback(
    (row: EntitiesGridData) => {
      const entityToRemove = row.name as string;
      const newInterceptor = cloneDeep(selectedInterceptor);
      newInterceptor.entities = newInterceptor.entities?.filter((entity) => entity !== entityToRemove);
      onChangeInterceptor(newInterceptor);
    },
    [onChangeInterceptor, selectedInterceptor],
  );

  const onSave = useCallback(() => {
    const req =
      selectedFormat === ExportFormat.CORE
        ? updateCoreInterceptor(selectedInterceptor as Record<string, unknown>, originalInterceptor.name || '', etag)
        : updateInterceptor(selectedInterceptor, etag);

    req.then((res) => {
      if (res.success) {
        setCoreInterceptor(null);
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Interceptors, t),
            getUpdateNotificationDescription(ApplicationRoute.Interceptors, selectedInterceptor.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedFormat, selectedInterceptor, originalInterceptor.name, etag, showNotification, t, router]);

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
      <div className={headerClassName}>
        {!jsonEditorEnabled && (
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
          removeEntity={removeInterceptor}
          jsonEditorEnabled={jsonEditorEnabled}
          toggleJsonEditor={toggleJsonEditor}
          selectedFormat={selectedFormat}
          setSelectedFormat={setSelectedFormat}
        />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {jsonEditorEnabled ? (
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
                <EntityHeader entity={selectedInterceptor} />
                <div className="flex-1 min-h-0 pt-4">
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
                schemaURL={selectedInterceptor.features?.configurationEndpoint}
                name={selectedInterceptor.name as string}
              />
            )}
            {activeTab === EntityViewTab.Entities && (
              <AddEntitiesView
                models={models}
                applications={applications}
                onAdd={onAddEntities}
                getRelevantDataForEntity={getRelevantDataForInterceptor.bind(this, selectedInterceptor)}
                onRemove={onRemoveEntity}
              />
            )}
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
