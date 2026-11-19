'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removeAlias, updateAlias } from '@/src/app/[lang]/assets-aliases/actions';
import { isAssetUnavailable } from '@/src/components/EntityView/Roles/utils';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ENTITY_VIEW_CLASS_NAME, ENTITY_VIEW_SCROLL_CLASS_NAME } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useAliasesFolder } from '@/src/context/assets/AliasesFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialAliasResource } from '@/src/models/dial/alias';
import { ConfigHealthSkippedEntity } from '@/src/models/dial/config-health';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalAlias: DialAliasResource;
  roles: DialRole[];
  /** Core's health entry for this alias, when it lists one. */
  healthIssue?: ConfigHealthSkippedEntity;
  /** A config.json alias is declared in the config file, so it can be read here and nowhere changed. */
  isConfigFileSource?: boolean;
  /** A stored Public alias, which Core does not let target a router. */
  isPublicSource?: boolean;
}

const AliasView: FC<Props> = ({ etag, originalAlias, roles, healthIssue, isConfigFileSource, isPublicSource }) => {
  const t = useI18n();
  const router = useRouter();
  const { fetchFiles } = useAliasesFolder();
  const { showNotification } = useNotification();
  const { setEntityReadOnly } = useAppContext();
  const getReqRef = useRef(useProtectedRequest());

  useEffect(() => {
    setEntityReadOnly(!!isConfigFileSource);
    return () => setEntityReadOnly(false);
  }, [isConfigFileSource, setEntityReadOnly]);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedAlias, setSelectedAlias] = useState(structuredClone(originalAlias));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);
  const tabs = useMemo(
    () => getTabsForAsset(t, ApplicationRoute.AssetsAliases, undefined, isAssetUnavailable(selectedAlias.userRoles)),
    [t, selectedAlias.userRoles],
  );

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
      onHideFormatSelector: () => !!isConfigFileSource,
    }),
    [isEditorEnabled, isConfigFileSource],
  );

  useEffect(() => {
    setSelectedAlias(structuredClone(originalAlias));
  }, [originalAlias]);

  useEffect(() => {
    if (Object.keys(selectedAlias).length && originalAlias) {
      setIsChanged(!isEqualSkippingUndefined(originalAlias, selectedAlias));
    }
  }, [selectedAlias, originalAlias]);

  const onDiscard = useCallback(() => {
    setSelectedAlias(structuredClone(originalAlias));
    setDiscardKey((prev) => prev + 1);
  }, [originalAlias]);

  const onSave = useCallback(() => {
    getReqRef.current(updateAlias, selectedAlias, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.AssetsAliases, t),
            getUpdateNotificationDescription(
              ApplicationRoute.AssetsAliases,
              selectedAlias._metadata?.name ?? selectedAlias.name,
              t,
            ),
          ),
        );
        fetchFiles(selectedAlias._metadata?.folderId ?? '');
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedAlias, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className={ENTITY_VIEW_CLASS_NAME}>
      <SimpleEntityHeader
        view={ApplicationRoute.AssetsAliases}
        entity={selectedAlias}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeAlias}
        getAssetContext={useAliasesFolder}
      />

      <div className={ENTITY_VIEW_SCROLL_CLASS_NAME}>
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedAlias}
            setSelectedEntity={setSelectedAlias}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            key={discardKey}
            activeTab={activeTab}
            selectedAlias={selectedAlias}
            roles={roles}
            healthIssue={healthIssue}
            isPublicSource={isPublicSource}
            onChange={setSelectedAlias}
          />
        )}
      </div>
    </div>
  );
};

export default AliasView;
