'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removeRouter, updateRouter } from '@/src/app/[lang]/platform-routers/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { isAssetUnavailable } from '@/src/components/EntityView/Roles/utils';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { ENTITY_VIEW_CLASS_NAME, ENTITY_VIEW_SCROLL_CLASS_NAME } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useRoutersFolder } from '@/src/context/assets/RoutersFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { DialRouterResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import type { CatalogSchemaOptions } from '@/src/server/catalog-schemas/read-options';
import type { ResourceInfo } from '@/src/server/core/asset-metadata';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalRouter: DialRouterResource;
  roles: DialRole[];
  /** i18n keys for non-fatal problems from the server-side option reads, resolved here. */
  optionWarnings?: EntitiesI18nKey[];
  translators?: ResourceInfo[];
  catalogSchemas?: CatalogSchemaOptions;
  schemes?: DialApplicationScheme[];
  /** True when `originalRouter` came from Core's config-file population, not the platform bucket. */
  isConfigFileSource?: boolean;
}

const RouterView: FC<Props> = ({
  etag: initialEtag,
  originalRouter,
  roles,
  optionWarnings,
  translators,
  catalogSchemas,
  schemes,
  isConfigFileSource,
}) => {
  const t = useI18n();
  const { featureFlags, setEntityReadOnly } = useAppContext();
  const router = useRouter();
  const { fetchFiles } = useRoutersFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  useEffect(() => {
    setEntityReadOnly(!!isConfigFileSource);
    return () => setEntityReadOnly(false);
  }, [isConfigFileSource, setEntityReadOnly]);

  const [etag, setEtag] = useState(initialEtag);
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedRouter, setSelectedRouter] = useState(structuredClone(originalRouter));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
      onHideFormatSelector: () => !!isConfigFileSource,
    }),
    [isEditorEnabled, isConfigFileSource],
  );

  const hasSchema = !!selectedRouter.applicationTypeSchemaId;
  const tabs = useMemo(
    () =>
      getTabsForAsset(
        t,
        ApplicationRoute.PlatformRouters,
        featureFlags,
        isAssetUnavailable(selectedRouter.userRoles),
        hasSchema,
      ),
    [t, featureFlags, selectedRouter.userRoles, hasSchema],
  );

  // Clearing the schema removes the Parameters tab, so an active tab that no longer exists falls back.
  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(EntityViewTab.Properties);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    setSelectedRouter(structuredClone(originalRouter));
  }, [originalRouter]);

  useEffect(() => {
    setEtag(initialEtag);
  }, [initialEtag]);

  // An option list read from only one of Core's two populations is shown rather than withheld, so the
  // user has to be told the list is incomplete — otherwise a missing role reads as deleted.
  useEffect(() => {
    optionWarnings?.forEach((warning) => {
      showNotification(getErrorNotification(t(EntitiesI18nKey.IncompleteOptionList), t(warning)));
    });
  }, [optionWarnings, showNotification, t]);

  useEffect(() => {
    if (Object.keys(selectedRouter).length && originalRouter) {
      setIsChanged(!isEqualSkippingUndefined(originalRouter, selectedRouter));
    }
  }, [selectedRouter, originalRouter]);

  const onDiscard = useCallback(() => {
    setSelectedRouter(structuredClone(originalRouter));
    setDiscardKey((prev) => prev + 1);
  }, [originalRouter]);

  const onSave = useCallback(() => {
    getReqRef.current(updateRouter, selectedRouter, etag).then((res) => {
      if (res.etag) {
        setEtag(res.etag);
      }
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.PlatformRouters, t),
            getUpdateNotificationDescription(ApplicationRoute.PlatformRouters, selectedRouter.name, t),
          ),
        );
        fetchFiles(selectedRouter._metadata?.folderId ?? '');
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedRouter, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className={ENTITY_VIEW_CLASS_NAME}>
      <SimpleEntityHeader
        view={ApplicationRoute.PlatformRouters}
        entity={selectedRouter}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeRouter}
        getAssetContext={useRoutersFolder}
      />

      <div className={ENTITY_VIEW_SCROLL_CLASS_NAME}>
        {isEditorEnabled && activeTab !== EntityViewTab.Parameters ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedRouter}
            setSelectedEntity={setSelectedRouter}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            key={discardKey}
            activeTab={activeTab}
            selectedRouter={selectedRouter}
            roles={roles}
            translators={translators}
            catalogSchemas={catalogSchemas}
            schemes={schemes}
            isEditorEnabled={isEditorEnabled}
            onChange={setSelectedRouter}
          />
        )}
      </div>
    </div>
  );
};

export default RouterView;
