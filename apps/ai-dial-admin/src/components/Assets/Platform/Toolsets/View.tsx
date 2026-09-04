'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cloneDeep } from 'lodash';

import {
  removePlatformToolset,
  signInToolset,
  signOutToolset,
  updatePlatformToolset,
} from '@/src/app/[lang]/assets-toolsets/actions';
import ResourceAuthButtons from '@/src/components/Assets/Resources/Auth/ResourceAuthButtons';
import TabsContent from '@/src/components/Assets/Toolsets/View/TabsContent';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { DialPlatformToolsetResource, DialToolsetResource } from '@/src/models/dial/resource';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset, rolesTab } from '@/src/utils/tabs/utils';

interface Props {
  etag: string;
  oAuthCode?: string | null;
  originalToolset: AssetToolset;
  roles: DialRole[];
  /** i18n keys for non-fatal problems from the server-side role-population read, resolved here. */
  optionWarnings?: EntitiesI18nKey[];
}

/**
 * Platform-bucket toolset detail view. Core gives platform-bucket toolsets full field/tab/auth parity
 * with public-bucket ones — verified against `ai-dial-core`'s `ToolSetService` (auth-secret
 * encryption and credential-locator scope both derive from the resource's own bucket, not the bucket
 * type) and `ToolsetOpsApi` (discovered-tools/sign-in/sign-out all resolve by the toolset's path,
 * regardless of bucket) — see design.md's Context. So this reuses the exact same
 * `Assets/Toolsets/View/TabsContent`/`ResourceAuthButtons` the public Toolsets view uses, passing
 * `view={ApplicationRoute.AssetsToolsets}` through them. Only the header chrome (no version
 * selector, no publish, no move) and which server actions get called differ here — mirrors
 * `Assets/Platform/Applications/View.tsx`.
 */
const PlatformToolsetView: FC<Props> = ({ etag, oAuthCode, originalToolset, roles, optionWarnings }) => {
  const t = useI18n();
  const router = useRouter();
  const { featureFlags } = useAppContext();
  const { fetchFiles } = useToolsetFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  // An option list read from only one of Core's two populations is shown rather than withheld, so the
  // user has to be told the list is incomplete — otherwise a missing role reads as deleted. Mirrors
  // `PlatformApplicationView`'s identical handling of its own Interceptors/Roles option-list warnings.
  useEffect(() => {
    optionWarnings?.forEach((warning) => {
      showNotification(getErrorNotification(t(EntitiesI18nKey.IncompleteOptionList), t(warning)));
    });
  }, [optionWarnings, showNotification, t]);

  // The platform bucket is the only `AssetsToolsets` bucket with a Roles tab (Issue #4406) —
  // `getTabsForAsset`'s shared `AssetsToolsets` branch stays untouched so the public bucket
  // (`ToolsetView.tsx`) is unaffected. Inserted right after `Tools` and before the
  // conditionally-appended `Audit` tab, matching the admin-BE `Toolsets` entity's own
  // `[Properties, Tools, Roles, Audit]` ordering.
  const tabs = useMemo(
    () => getTabsForAsset(t, ApplicationRoute.AssetsToolsets, featureFlags).toSpliced(2, 0, rolesTab(t)),
    [t, featureFlags],
  );
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedToolset, setSelectedToolset] = useState(cloneDeep(originalToolset));
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
    setSelectedToolset(cloneDeep(originalToolset));
  }, [originalToolset]);

  useEffect(() => {
    if (Object.keys(selectedToolset).length && originalToolset) {
      setIsChanged(!isEqualSkippingUndefined(originalToolset, selectedToolset));
    }
  }, [selectedToolset, originalToolset]);

  const onDiscard = useCallback(() => {
    setDiscardKey((prev) => prev + 1);
    setSelectedToolset(cloneDeep(originalToolset));
  }, [originalToolset]);

  const onSave = useCallback(() => {
    getReqRef
      .current(updatePlatformToolset, selectedToolset as unknown as DialPlatformToolsetResource, etag)
      .then((res) => {
        if (res.success) {
          showNotification(
            getSuccessNotification(
              getUpdateNotificationTitle(ApplicationRoute.AssetsToolsets, t),
              getUpdateNotificationDescription(ApplicationRoute.AssetsToolsets, selectedToolset.name, t),
            ),
          );
          fetchFiles(selectedToolset.folderId);
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
  }, [selectedToolset, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.AssetsToolsets}
        entity={selectedToolset}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removePlatformToolset}
        getAssetContext={useToolsetFolder}
      >
        <ResourceAuthButtons
          view={ApplicationRoute.AssetsToolsets}
          selectedToolset={selectedToolset as DialToolsetResource}
          signInToolset={signInToolset}
          signOutToolset={signOutToolset}
          oAuthCode={oAuthCode}
        />
      </SimpleEntityHeader>

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedToolset}
            setSelectedEntity={setSelectedToolset}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            key={discardKey}
            activeTab={activeTab}
            selectedToolset={selectedToolset}
            originalToolset={originalToolset}
            roles={roles}
            onChange={setSelectedToolset}
          />
        )}
      </div>
    </div>
  );
};

export default PlatformToolsetView;
