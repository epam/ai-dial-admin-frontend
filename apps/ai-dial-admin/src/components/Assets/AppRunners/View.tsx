'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removeRunner, updateRunner } from '@/src/app/[lang]/assets-app-runners/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { useAppRunnersFolder } from '@/src/context/assets/AppRunnersFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialAppRunnerResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { validateAppRunner } from '@/src/utils/app-runners/validation';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalRunner: DialAppRunnerResource;
  roles: DialRole[];
  interceptors: DialInterceptor[];
  globalInterceptors: string[];
  /** i18n keys for non-fatal problems from the server-side option reads, resolved here. */
  optionWarnings?: EntitiesI18nKey[];
}

const AppRunnerAssetView: FC<Props> = ({
  etag,
  originalRunner,
  roles,
  interceptors,
  globalInterceptors,
  optionWarnings,
}) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.AssetsAppRunners);
  const router = useRouter();
  const { fetchFiles } = useAppRunnersFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedRunner, setSelectedRunner] = useState(structuredClone(originalRunner));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setSelectedRunner(structuredClone(originalRunner));
  }, [originalRunner]);

  // An option list read from only one of Core's two populations is shown rather than withheld, so the
  // user has to be told the list is incomplete — otherwise a missing interceptor reads as deleted.
  useEffect(() => {
    optionWarnings?.forEach((warning) => {
      showNotification(getErrorNotification(t(EntitiesI18nKey.IncompleteOptionList), t(warning)));
    });
  }, [optionWarnings, showNotification, t]);

  useEffect(() => {
    if (Object.keys(selectedRunner).length && originalRunner) {
      setIsChanged(!isEqualSkippingUndefined(originalRunner, selectedRunner));
    }
  }, [selectedRunner, originalRunner]);

  const onDiscard = useCallback(() => {
    setIsSkipRefresh(false);
    setSelectedRunner(structuredClone(originalRunner));
    setDiscardKey((prev) => prev + 1);
  }, [originalRunner]);

  const onChange = useCallback((runner: DialAppRunnerResource, skipRefresh?: boolean) => {
    setSelectedRunner(runner);
    setIsSkipRefresh(!!skipRefresh);
  }, []);

  const onSave = useCallback(() => {
    const errors = validateAppRunner(selectedRunner);
    if (errors.length) {
      showNotification(
        getErrorNotification(
          t(EntitiesI18nKey.InvalidAppRunner),
          errors.map((error) => `${error.field}: ${error.message}`).join('; '),
        ),
      );
      return;
    }
    getReqRef.current(updateRunner, selectedRunner, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.AssetsAppRunners, t),
            getUpdateNotificationDescription(ApplicationRoute.AssetsAppRunners, selectedRunner.$id, t),
          ),
        );
        fetchFiles(selectedRunner.folderId);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedRunner, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.AssetsAppRunners}
        entity={selectedRunner}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeRunner}
        getAssetContext={useAppRunnersFolder}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedRunner}
            setSelectedEntity={setSelectedRunner}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            key={discardKey}
            activeTab={activeTab}
            runner={selectedRunner}
            roles={roles}
            interceptors={interceptors}
            globalInterceptors={globalInterceptors}
            isSkipRefresh={isSkipRefresh}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
};

export default AppRunnerAssetView;
