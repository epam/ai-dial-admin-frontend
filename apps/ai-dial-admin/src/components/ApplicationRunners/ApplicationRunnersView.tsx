'use client';

import classNames from 'classnames';
import { cloneDeep, isEqual } from 'lodash';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import { removeApplicationScheme, updateApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import { EntityViewTab, parametersTabs, propertiesTabs } from '@/src/components/EntityView/entity-view';
import EntityViewHeaderButtons from '@/src/components/EntityView/EntityViewHeaderButtons';
import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import { TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { TabModel } from '@/src/models/tab';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import AppRunnerApplications from './ConfigurationView/AppRunnerApplications';
import SchemeParameters from './ConfigurationView/AppRunnerParameters';
import SchemeProperties from './ConfigurationView/AppRunnerProperties';

interface Props {
  originalScheme: DialApplicationScheme;
}

const ApplicationRunnersView: FC<Props> = ({ originalScheme }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();

  const tabs: TabModel[] = [
    propertiesTabs(t),
    parametersTabs(t),
    { id: EntityViewTab.Applications, name: t(TabsI18nKey.Applications) },
  ];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedScheme, setSelectedScheme] = useState(cloneDeep(originalScheme));
  const [isChanged, setIsChanged] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [jsonErrors, setJsonErrors] = useState<JSONEditorError[]>([]);
  const [errorNotifications, setErrorNotifications] = useState<JSONEditorErrorNotification[]>([]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setSelectedScheme(cloneDeep(originalScheme));
  }, [originalScheme]);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

  useEffect(() => {
    setIsChanged(!isEqual(originalScheme, selectedScheme));
  }, [selectedScheme, originalScheme]);

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
    setSelectedScheme(originalScheme);
  }, [setSelectedScheme, originalScheme, jsonEditorEnabled]);

  const onChangeScheme = useCallback(
    (entity: DialApplicationScheme) => {
      setSelectedScheme(entity);
    },
    [setSelectedScheme],
  );

  const toggleJsonEditor = useCallback(() => {
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const onSave = useCallback(() => {
    updateApplicationScheme(selectedScheme).then((res) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedScheme, router, showNotification]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
        <EntityViewHeaderButtons
          view={ApplicationRoute.ApplicationRunners}
          entity={selectedScheme}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onSave}
          removeEntity={removeApplicationScheme}
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
            model={selectedScheme}
            errorNotifications={errorNotifications}
            setSelectedEntity={setSelectedScheme}
            setIsChanged={setIsChanged}
            setJsonErrors={setJsonErrors}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && (
              <div className="pt-3 w-full lg:w-[35%]">
                <SchemeProperties entity={selectedScheme} isImmutable={true} onChangeScheme={onChangeScheme} />
              </div>
            )}

            {activeTab === EntityViewTab.Parameters && (
              <SchemeParameters scheme={selectedScheme} onChangeScheme={onChangeScheme} />
            )}

            {activeTab === EntityViewTab.Applications && (
              <AppRunnerApplications appRunner={selectedScheme} onChangeAppRunner={onChangeScheme} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicationRunnersView;
