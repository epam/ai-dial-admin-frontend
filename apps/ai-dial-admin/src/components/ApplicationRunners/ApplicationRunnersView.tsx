'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';
import { cloneDeep } from 'lodash';

import { removeApplicationScheme, updateApplicationScheme } from '@/src/app/[lang]/application-runners/actions';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import EntityRoutes from '@/src/components/EntityView/AppRoute/AppRoute';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import {
  appRouteTab,
  auditTabs,
  EntityViewTab,
  parametersTabs,
  propertiesTabs,
} from '@/src/components/EntityView/View/utils';
import { TabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialRole } from '@/src/models/dial/role';
import { TabModel } from '@/src/models/tab';
import { ApplicationRoute } from '@/src/types/routes';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification } from '@/src/utils/notification';
import AppRunnerApplications from './ConfigurationView/Applications';
import SchemeParameters from './ConfigurationView/Parameters';
import SchemeProperties from './ConfigurationView/Properties';
import { getCoreEntity } from '@/src/app/[lang]/export-config/actions';
import { ExportFormat } from '@/src/types/export';
import {
  getEntityFromFile,
  getExportType,
  getFileFromEntity,
} from '@/src/components/EntityView/View/core-entity-utils';
import { updateCoreEntity } from '@/src/app/[lang]/import-config/actions';

interface Props {
  originalScheme: DialApplicationScheme;
  roles: DialRole[] | null;
}

const ApplicationRunnersView: FC<Props> = ({ originalScheme, roles }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();

  const tabs: TabModel[] = [
    propertiesTabs(t),
    parametersTabs(t),
    { id: EntityViewTab.Applications, name: t(TabsI18nKey.Applications) },
    appRouteTab(t),
    auditTabs(t),
  ];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedRunner, setSelectedRunner] = useState(cloneDeep(originalScheme));
  const [isChanged, setIsChanged] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [key, setKey] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.ADMIN);
  const [coreRunner, setCoreRunner] = useState<DialApplicationScheme | null>(null);

  useEffect(() => {
    const name = originalScheme?.$id;
    if (!coreRunner && name) {
      getCoreEntity(name, getExportType(ApplicationRoute.ApplicationRunners)).then((data) => {
        setCoreRunner(getEntityFromFile(ApplicationRoute.ApplicationRunners, name, data) as DialApplicationScheme);
      });
    }
  }, [coreRunner, originalScheme]);

  useEffect(() => {
    setSelectedRunner(
      selectedFormat === ExportFormat.CORE ? cloneDeep(coreRunner as DialApplicationScheme) : cloneDeep(originalScheme),
    );
  }, [selectedFormat, coreRunner, originalScheme]);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

  useEffect(() => {
    const isEqualAdminRunner = isEqualSkippingUndefined(originalScheme, selectedRunner);
    const isEqualCoreRunner = isEqualSkippingUndefined(selectedRunner, coreRunner);

    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreRunner : !isEqualAdminRunner);
  }, [selectedFormat, originalScheme, selectedRunner, coreRunner]);

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
    setSelectedRunner(originalScheme);
  }, [jsonEditorEnabled, originalScheme, dispatch]);

  const onChangeScheme = useCallback(
    (entity: DialApplicationScheme) => {
      setSelectedRunner(entity);
    },
    [setSelectedRunner],
  );

  const toggleJsonEditor = useCallback(() => {
    setSelectedFormat(ExportFormat.ADMIN);
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const onSave = useCallback(() => {
    const req =
      selectedFormat === ExportFormat.CORE
        ? updateCoreEntity(getFileFromEntity(ApplicationRoute.ApplicationRunners, selectedRunner))
        : updateApplicationScheme(selectedRunner);

    req.then((res) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedFormat, selectedRunner, router, showNotification]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
        <HeaderButtons
          view={ApplicationRoute.ApplicationRunners}
          entity={selectedRunner}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onSave}
          removeEntity={removeApplicationScheme}
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
            entity={selectedRunner}
            setSelectedEntity={setSelectedRunner}
            setIsChanged={setIsChanged}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && (
              <div className="pt-3 w-full lg:w-[35%]">
                <EntityHeader entity={selectedRunner} />
                <div className="flex-1 min-h-0 pt-4">
                  <SchemeProperties runner={selectedRunner} isImmutable={true} onChangeRunner={onChangeScheme} />
                </div>
              </div>
            )}

            {activeTab === EntityViewTab.Parameters && (
              <SchemeParameters scheme={selectedRunner} onChangeScheme={onChangeScheme} />
            )}

            {activeTab === EntityViewTab.Applications && (
              <AppRunnerApplications appRunner={selectedRunner} onChangeAppRunner={onChangeScheme} />
            )}

            {activeTab === EntityViewTab.Routes && (
              <EntityRoutes
                iAppRunnerView={true}
                roles={roles}
                routes={selectedRunner['dial:applicationTypeRoutes']}
                onChangeRoutes={(routes) =>
                  setSelectedRunner({ ...selectedRunner, ['dial:applicationTypeRoutes']: routes })
                }
              />
            )}

            {activeTab === EntityViewTab.Audit && (
              <EntityAudit entity={selectedRunner} view={ApplicationRoute.ApplicationRunners} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicationRunnersView;
