'use client';

import classNames from 'classnames';
import { cloneDeep } from 'lodash';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import { removeInterceptor, updateInterceptor } from '@/src/app/[lang]/interceptors/actions';
import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import { getRelevantDataForInterceptor } from '@/src/components/AddEntitiesTab/AddEntitiesView.utils';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import { auditTabs, EntityViewTab, propertiesTabs } from '@/src/components/EntityView/View/utils';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import { TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { TabModel } from '@/src/models/tab';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import InterceptorProperties from './InterceptorProperties';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';

interface Props {
  originalInterceptor: DialInterceptor;
  names: string[];
  models: DialModel[];
  applications: DialApplication[];
}

const InterceptorView: FC<Props> = ({ originalInterceptor, names, models, applications }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();

  const tabs: TabModel[] = [
    propertiesTabs(t),
    { id: EntityViewTab.Entities, name: t(TabsI18nKey.Entities) },
    auditTabs(t),
  ];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedInterceptor, setSelectedInterceptor] = useState(cloneDeep(originalInterceptor));
  const [isChanged, setIsChanged] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [jsonErrors, setJsonErrors] = useState<JSONEditorError[]>([]);
  const [errorNotifications, setErrorNotifications] = useState<JSONEditorErrorNotification[]>([]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setSelectedInterceptor(cloneDeep(originalInterceptor));
  }, [originalInterceptor]);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(originalInterceptor, selectedInterceptor));
  }, [selectedInterceptor, originalInterceptor]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onDiscard = useCallback(() => {
    if (jsonEditorEnabled) {
      setJsonErrors([]);
      setIsChanged(false);
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedInterceptor(originalInterceptor);
  }, [setSelectedInterceptor, originalInterceptor, jsonEditorEnabled]);

  const onChangeInterceptor = useCallback(
    (entity: DialInterceptor) => {
      setSelectedInterceptor(entity);
    },
    [setSelectedInterceptor],
  );

  const toggleJsonEditor = useCallback(() => {
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
    updateInterceptor(selectedInterceptor).then((res) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedInterceptor, router, showNotification]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
        <HeaderButtons
          view={ApplicationRoute.Interceptors}
          entity={selectedInterceptor}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onSave}
          removeEntity={removeInterceptor}
          jsonEditorEnabled={jsonEditorEnabled}
          toggleJsonEditor={toggleJsonEditor}
          jsonErrors={jsonErrors}
          setErrorNotifications={setErrorNotifications}
        />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {jsonEditorEnabled ? (
          <JSONEditor
            key={key}
            entity={selectedInterceptor}
            errorNotifications={errorNotifications}
            setSelectedEntity={setSelectedInterceptor}
            setIsChanged={setIsChanged}
            setJsonErrors={setJsonErrors}
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
