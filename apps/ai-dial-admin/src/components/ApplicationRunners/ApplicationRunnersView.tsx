'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';
import { cloneDeep } from 'lodash';

import { removeApplicationScheme, updateApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import {
  appRouteTab,
  auditTabs,
  EntityViewTab,
  parametersTabs,
  propertiesTabs,
} from '@/src/components/EntityView/View/utils';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import { TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { TabModel } from '@/src/models/tab';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import AppRunnerApplications from './ConfigurationView/Applications';
import SchemeParameters from './ConfigurationView/Parameters';
import SchemeProperties from './ConfigurationView/Properties';
import EntityRoutes from '@/src/components/EntityView/AppRoute/AppRoute';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { DialRole } from '@/src/models/dial/role';

interface Props {
  originalScheme: DialApplicationScheme;
  roles: DialRole[] | null;
}

const ApplicationRunnersView: FC<Props> = ({ originalScheme, roles }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();

  const tabs: TabModel[] = [
    propertiesTabs(t),
    parametersTabs(t),
    { id: EntityViewTab.Applications, name: t(TabsI18nKey.Applications) },
    appRouteTab(t),
    auditTabs(t),
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
    setIsChanged(!isEqualSkippingUndefined(originalScheme, selectedScheme));
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
        <HeaderButtons
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
            entity={selectedScheme}
            errorNotifications={errorNotifications}
            setSelectedEntity={setSelectedScheme}
            setIsChanged={setIsChanged}
            setJsonErrors={setJsonErrors}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && (
              <div className="pt-3 w-full lg:w-[35%]">
                <EntityHeader entity={selectedScheme} />
                <div className="flex-1 min-h-0 pt-4">
                  <SchemeProperties runner={selectedScheme} isImmutable={true} onChangeRunner={onChangeScheme} />
                </div>
              </div>
            )}

            {activeTab === EntityViewTab.Parameters && (
              <SchemeParameters scheme={selectedScheme} onChangeScheme={onChangeScheme} />
            )}

            {activeTab === EntityViewTab.Applications && (
              <AppRunnerApplications appRunner={selectedScheme} onChangeAppRunner={onChangeScheme} />
            )}

            {activeTab === EntityViewTab.Routes && (
              <EntityRoutes
                iAppRunnerView={true}
                roles={roles}
                routes={selectedScheme['dial:applicationTypeRoutes']}
                onChangeRoutes={(routes) =>
                  setSelectedScheme({ ...selectedScheme, ['dial:applicationTypeRoutes']: routes })
                }
              />
            )}

            {activeTab === EntityViewTab.Audit && (
              <EntityAudit entity={selectedScheme} view={ApplicationRoute.ApplicationRunners} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicationRunnersView;
