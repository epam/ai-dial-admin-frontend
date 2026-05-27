'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cloneDeep } from 'lodash';

import { getCoreRoute, removeRoute, updateCoreRoute, updateRoute } from '@/src/app/[lang]/routes/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import { DialRoute } from '@/src/models/dial/route';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getRouteTabs } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  originalRoute: DialRoute;
  names: string[];
  etag: string;
  roles: DialRole[];
}

const RouteView: FC<Props> = ({ originalRoute, etag, names, roles }) => {
  const t = useI18n();
  const router = useRouter();
  const { dispatch } = useSaveValidationContext();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());
  const tabs = getRouteTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedRoute, setSelectedRoute] = useState(cloneDeep(originalRoute));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(ExportFormat.ADMIN);
  const [coreRoute, setCoreRoute] = useState<DialRoute | null>(null);
  const [discardKey, setDiscardKey] = useState(0);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      selectedFormat,
      onChangeSelectedFormat: setSelectedFormat,
      onToggleEditor: () => {
        setSelectedFormat(ExportFormat.ADMIN);

        setIsEditorEnabled((prev) => !prev);
      },
    }),
    [isEditorEnabled, selectedFormat],
  );

  useEffect(() => {
    const name = originalRoute?.name;
    if (!coreRoute && name) {
      getReqRef.current(getCoreRoute, name).then((data) => {
        setCoreRoute(data.response);
      });
    }
  }, [coreRoute, originalRoute]);

  useEffect(() => {
    setSelectedRoute(
      selectedFormat === ExportFormat.CORE ? cloneDeep(coreRoute as DialRoute) : cloneDeep(originalRoute),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, originalRoute]);

  useEffect(() => {
    const isEqualAdminRoute = isEqualSkippingUndefined(originalRoute, selectedRoute);
    const isEqualCoreRoute = isEqualSkippingUndefined(selectedRoute, coreRoute);

    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreRoute : !isEqualAdminRoute);
  }, [selectedFormat, originalRoute, selectedRoute, coreRoute]);

  const onDiscard = useCallback(() => {
    if (isEditorEnabled) {
      setSelectedFormat(ExportFormat.ADMIN);
    }
    setSelectedRoute(cloneDeep(originalRoute));
    setDiscardKey((prev) => prev + 1);
  }, [isEditorEnabled, originalRoute]);

  const onSaveRoute = useCallback(() => {
    const req =
      selectedFormat === ExportFormat.CORE
        ? getReqRef.current(updateCoreRoute, selectedRoute as Record<string, unknown>, originalRoute.name || '', etag)
        : getReqRef.current(updateRoute, selectedRoute, etag);
    req.then((res) => {
      if (res.success) {
        dispatch({ type: ValidationActionType.Reset });
        setCoreRoute(null);
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Routes, t),
            getUpdateNotificationDescription(ApplicationRoute.Routes, selectedRoute.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedFormat, selectedRoute, originalRoute.name, etag, dispatch, showNotification, t, router]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.Routes}
        entity={selectedRoute}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSaveRoute}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeRoute}
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
            selectedFormat={selectedFormat}
            activeTab={activeTab}
            route={selectedRoute}
            onChangeRoute={setSelectedRoute}
            roles={roles}
            routeNames={names}
          />
        )}
      </div>
    </div>
  );
};

export default RouteView;
