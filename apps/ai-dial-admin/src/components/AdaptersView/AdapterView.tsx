'use client';
import { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';
import { cloneDeep, isEqual } from 'lodash';
import { useRouter } from 'next/navigation';

import { removeAdapter, updateAdapter } from '@/src/app/[lang]/adapters/actions';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import { EntityViewTab, propertiesTabs } from '@/src/components/EntityView/entity-view';
import EntityViewHeaderButtons from '@/src/components/EntityView/EntityViewHeaderButtons';
import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import { TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialAdapter } from '@/src/models/dial/adapter';
import { TabModel } from '@/src/models/tab';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import AdapterModels from './AdapterModels';
import AdapterProperties from './AdapterProperties';

interface Props {
  originalAdapter: DialAdapter;
}

const AdapterView: FC<Props> = ({ originalAdapter }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();

  const tabs: TabModel[] = [propertiesTabs(t), { id: EntityViewTab.Models, name: t(TabsI18nKey.Models) }];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedAdapter, setSelectedAdapter] = useState(cloneDeep(originalAdapter));
  const [isChanged, setIsChanged] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [jsonErrors, setJsonErrors] = useState<JSONEditorError[]>([]);
  const [errorNotifications, setErrorNotifications] = useState<JSONEditorErrorNotification[]>([]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setSelectedAdapter(cloneDeep(originalAdapter));
  }, [originalAdapter]);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

  useEffect(() => {
    setIsChanged(!isEqual(originalAdapter, selectedAdapter));
  }, [selectedAdapter, originalAdapter]);

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
    setSelectedAdapter(originalAdapter);
  }, [setSelectedAdapter, originalAdapter, jsonEditorEnabled]);

  const onChangeAdapter = useCallback(
    (entity: DialAdapter) => {
      setSelectedAdapter(entity);
    },
    [setSelectedAdapter],
  );

  const toggleJsonEditor = useCallback(() => {
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const onSave = useCallback(() => {
    updateAdapter(selectedAdapter).then((res) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedAdapter, router, showNotification]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
        <EntityViewHeaderButtons
          view={ApplicationRoute.Adapters}
          entity={selectedAdapter}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onSave}
          removeEntity={removeAdapter}
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
            model={selectedAdapter}
            errorNotifications={errorNotifications}
            setSelectedEntity={setSelectedAdapter}
            setIsChanged={setIsChanged}
            setJsonErrors={setJsonErrors}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && (
              <div className="lg:w-[35%] flex flex-col gap-6 mt-3">
                <AdapterProperties
                  entity={selectedAdapter}
                  onChangeAdapter={onChangeAdapter}
                  isEntityImmutable={true}
                />
              </div>
            )}
            {activeTab === EntityViewTab.Models && (
              <div className="w-full h-full">
                <AdapterModels adapter={selectedAdapter} onChangeAdapter={onChangeAdapter} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdapterView;
