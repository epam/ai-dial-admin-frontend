'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

import { DialTabs, TabModel } from '@epam/ai-dial-ui-kit';
import { cloneDeep } from 'lodash';

import { getCoreToolset, removeToolset, updateCoreToolset, updateToolset } from '@/src/app/[lang]/toolsets/actions';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import EntityRolesModal from '@/src/components/EntityView/Modals/EmptyRoles/EmptyRoles';
import EntityRoles from '@/src/components/EntityView/Roles/Roles';
import { isDisableRole } from '@/src/components/EntityView/Roles/utils';
import ToolsView from '@/src/components/Toolsets/Tools/Tools';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialRole } from '@/src/models/dial/role';
import { Toolset } from '@/src/models/dial/toolset';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getToolsetTabs } from '@/src/utils/tabs/utils';
import ToolsetProperties from './Properties';
import { getViewHeaderClassNames } from '@/src/utils/entities/view';

interface Props {
  etag: string;
  names: string[];
  roles: DialRole[] | null | undefined;
  originalToolset: Toolset;
}

const ToolsetView: FC<Props> = ({ names, etag, roles, originalToolset }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const tabs: TabModel[] = getToolsetTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToolset, setSelectedToolset] = useState(cloneDeep(originalToolset));
  const [isChanged, setIsChanged] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState<boolean>(true);
  const [key, setKey] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.ADMIN);
  const [coreToolset, setCoreToolset] = useState<Toolset | null>(null);

  useEffect(() => {
    const name = originalToolset?.name;
    if (!coreToolset && name) {
      getReqRef.current(getCoreToolset, name).then((data) => {
        setCoreToolset(data.response);
      });
    }
  }, [coreToolset, originalToolset]);

  useEffect(() => {
    setSelectedToolset(
      selectedFormat === ExportFormat.CORE ? cloneDeep(coreToolset as Toolset) : cloneDeep(originalToolset),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, originalToolset]);

  useEffect(() => {
    const isEqualAdminToolset = isEqualSkippingUndefined(originalToolset, selectedToolset);
    const isEqualCoreToolset = isEqualSkippingUndefined(selectedToolset, coreToolset);
    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreToolset : !isEqualAdminToolset);
  }, [selectedFormat, originalToolset, selectedToolset, coreToolset]);

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
    setSelectedToolset(originalToolset);
    setIsSkipRefresh(false);
  }, [jsonEditorEnabled, originalToolset, dispatch]);

  const onChangeToolset = useCallback(
    (entity: Toolset, skipRefresh?: boolean) => {
      setSelectedToolset(entity);
      setIsSkipRefresh(!!skipRefresh);
    },
    [setSelectedToolset],
  );

  const toggleJsonEditor = useCallback(() => {
    setSelectedFormat(ExportFormat.ADMIN);
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const onSave = useCallback(() => {
    const req =
      selectedFormat === ExportFormat.CORE
        ? getReqRef.current(
            updateCoreToolset,
            selectedToolset as Record<string, unknown>,
            originalToolset.name || '',
            etag,
          )
        : getReqRef.current(updateToolset, selectedToolset, etag);

    req.then((res) => {
      if (res.success) {
        setCoreToolset(null);
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Toolsets, t),
            getUpdateNotificationDescription(ApplicationRoute.Toolsets, selectedToolset.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
      setIsModalOpen(false);
    });
  }, [selectedFormat, selectedToolset, originalToolset.name, etag, showNotification, t, router]);

  const onTryToSave = useCallback(() => {
    if (
      selectedFormat !== ExportFormat.CORE &&
      isDisableRole(selectedToolset as EntityRoleLimits) &&
      !jsonEditorEnabled
    ) {
      setIsModalOpen(true);
    } else {
      onSave();
    }
  }, [jsonEditorEnabled, onSave, selectedFormat, selectedToolset]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={getViewHeaderClassNames(jsonEditorEnabled)}>
        {!jsonEditorEnabled && (
          <div className="flex-1 min-w-0">
            <DialTabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} />
          </div>
        )}
        <HeaderButtons
          view={ApplicationRoute.Toolsets}
          entity={selectedToolset}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onTryToSave}
          removeEntity={removeToolset}
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
            entity={selectedToolset}
            setSelectedEntity={setSelectedToolset}
            setIsChanged={setIsChanged}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && (
              <ToolsetProperties names={names} selectedToolset={selectedToolset} onChangeToolset={onChangeToolset} />
            )}

            {activeTab === EntityViewTab.Tools && (
              <ToolsView
                originalToolset={originalToolset}
                selectedToolset={selectedToolset}
                onChangeToolset={onChangeToolset}
              />
            )}

            {activeTab === EntityViewTab.Roles && (
              <EntityRoles
                entity={selectedToolset}
                view={ApplicationRoute.Toolsets}
                roles={roles || []}
                onChangeEntity={onChangeToolset}
                isSkipRefresh={isSkipRefresh}
              />
            )}

            {activeTab === EntityViewTab.Audit && (
              <EntityAudit entity={selectedToolset} view={ApplicationRoute.Toolsets} />
            )}

            {isModalOpen && (
              <EntityRolesModal
                onConfirm={() => onSave()}
                onClose={() => setIsModalOpen(false)}
                onCancel={() => setIsModalOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ToolsetView;
