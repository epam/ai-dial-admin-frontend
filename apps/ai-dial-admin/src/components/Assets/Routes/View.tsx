'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removeRoute, updateRoute } from '@/src/app/[lang]/assets-routes/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useRoutesFolder } from '@/src/context/assets/RoutesFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import { DialRouteResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalRoute: DialRouteResource;
  roles: DialRole[];
  /** i18n keys for non-fatal problems from the server-side option reads, resolved here. */
  optionWarnings?: EntitiesI18nKey[];
}

const RouteAssetView: FC<Props> = ({ etag, originalRoute, roles, optionWarnings }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.AssetsRoutes);
  const router = useRouter();
  const { fetchFiles } = useRoutesFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedRoute, setSelectedRoute] = useState(structuredClone(originalRoute));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setSelectedRoute(structuredClone(originalRoute));
  }, [originalRoute]);

  // An option list read from only one of Core's two populations is shown rather than withheld, so the
  // user has to be told the list is incomplete — otherwise a missing role reads as revoked.
  useEffect(() => {
    optionWarnings?.forEach((warning) => {
      showNotification(getErrorNotification(t(EntitiesI18nKey.IncompleteOptionList), t(warning)));
    });
  }, [optionWarnings, showNotification, t]);

  useEffect(() => {
    if (Object.keys(selectedRoute).length && originalRoute) {
      setIsChanged(!isEqualSkippingUndefined(originalRoute, selectedRoute));
    }
  }, [selectedRoute, originalRoute]);

  const onDiscard = useCallback(() => {
    setSelectedRoute(structuredClone(originalRoute));
    setDiscardKey((prev) => prev + 1);
  }, [originalRoute]);

  const onSave = useCallback(() => {
    getReqRef.current(updateRoute, selectedRoute, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.AssetsRoutes, t),
            getUpdateNotificationDescription(ApplicationRoute.AssetsRoutes, selectedRoute.name, t),
          ),
        );
        fetchFiles(selectedRoute.folderId);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedRoute, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.AssetsRoutes}
        entity={selectedRoute}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeRoute}
        getAssetContext={useRoutesFolder}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedRoute}
            setSelectedEntity={setSelectedRoute}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            activeTab={activeTab}
            selectedRoute={selectedRoute}
            originalRoute={originalRoute}
            roles={roles}
            onChange={setSelectedRoute}
          />
        )}
      </div>
    </div>
  );
};

export default RouteAssetView;
