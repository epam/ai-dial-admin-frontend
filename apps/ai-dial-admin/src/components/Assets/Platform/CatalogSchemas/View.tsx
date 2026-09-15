'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removeCatalogSchema, updateCatalogSchema } from '@/src/app/[lang]/platform-catalog-schemas/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useCatalogSchemasFolder } from '@/src/context/assets/CatalogSchemasFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialCatalogSchemaResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { validateCatalogSchema } from '@/src/utils/catalog-schemas/validation';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalSchema: DialCatalogSchemaResource;
  /** True when `originalSchema` came from Core's config-file population (`config-file-entity-views`). */
  isConfigFileSource?: boolean;
}

const CatalogSchemaView: FC<Props> = ({ etag, originalSchema, isConfigFileSource }) => {
  const t = useI18n();
  const tabs = getTabsForAsset(t, ApplicationRoute.PlatformCatalogSchemas);
  const router = useRouter();
  const { fetchFiles } = useCatalogSchemasFolder();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());
  const { setEntityReadOnly } = useAppContext();

  // Config-file entities have no write endpoint and no admin-backend "compare with Core" projection
  // of their own (they already *are* Core's view) — see `config-file-entity-views`.
  useEffect(() => {
    setEntityReadOnly(!!isConfigFileSource);
    return () => setEntityReadOnly(false);
  }, [isConfigFileSource, setEntityReadOnly]);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedSchema, setSelectedSchema] = useState(structuredClone(originalSchema));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
      // A config-file-sourced entity has no admin-backend "compare with Core" projection of its own —
      // it already is Core's own view — so the ADMIN|CORE format selector has nothing to switch to.
      onHideFormatSelector: () => !!isConfigFileSource,
    }),
    [isEditorEnabled, isConfigFileSource],
  );

  useEffect(() => {
    setSelectedSchema(structuredClone(originalSchema));
  }, [originalSchema]);

  useEffect(() => {
    if (Object.keys(selectedSchema).length && originalSchema) {
      setIsChanged(!isEqualSkippingUndefined(originalSchema, selectedSchema));
    }
  }, [selectedSchema, originalSchema]);

  const onDiscard = useCallback(() => {
    setSelectedSchema(structuredClone(originalSchema));
    setDiscardKey((prev) => prev + 1);
  }, [originalSchema]);

  const onChange = useCallback((schema: DialCatalogSchemaResource, skipRefresh?: boolean) => {
    setSelectedSchema(schema);
    setIsSkipRefresh(!!skipRefresh);
  }, []);

  const onSave = useCallback(() => {
    // Core stores this body verbatim and checks only the `$id`, so this is the only gate — including
    // for the raw JSON editor, which can hand over arbitrary parsed JSON.
    const errors = validateCatalogSchema(selectedSchema);
    if (errors.length) {
      showNotification(
        getErrorNotification(
          t(EntitiesI18nKey.InvalidCatalogSchema),
          errors.map((error) => `${error.field}: ${error.message}`).join('; '),
        ),
      );
      return;
    }
    getReqRef.current(updateCatalogSchema, selectedSchema, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.PlatformCatalogSchemas, t),
            getUpdateNotificationDescription(ApplicationRoute.PlatformCatalogSchemas, selectedSchema.$id, t),
          ),
        );
        fetchFiles(selectedSchema.folderId);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedSchema, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.PlatformCatalogSchemas}
        entity={selectedSchema}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeCatalogSchema}
        getAssetContext={useCatalogSchemasFolder}
      />

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedSchema}
            setSelectedEntity={setSelectedSchema}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            key={discardKey}
            activeTab={activeTab}
            schema={selectedSchema}
            isSkipRefresh={isSkipRefresh}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
};

export default CatalogSchemaView;
