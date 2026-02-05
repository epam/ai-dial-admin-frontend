'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cloneDeep } from 'lodash';

import { getCoreToolset, removeToolset, updateCoreToolset, updateToolset } from '@/src/app/[lang]/toolsets/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import EntityRolesModal from '@/src/components/EntityView/Modals/EmptyRoles/EmptyRoles';
import { isDisableRole } from '@/src/components/EntityView/Roles/utils';
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
import AuthButtons from '../Auth/AuthButtons';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  names: string[];
  roles?: DialRole[] | null;
  originalToolset: Toolset;
  oAuthCode?: string | null;
  isUserLevel?: boolean;
}

const ToolsetView: FC<Props> = ({ names, isUserLevel, oAuthCode, etag, roles, originalToolset }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const tabs = getToolsetTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedToolset, setSelectedToolset] = useState(cloneDeep(originalToolset));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.ADMIN);
  const [coreToolset, setCoreToolset] = useState<Toolset | null>(null);

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

  const onDiscard = useCallback(() => {
    if (isEditorEnabled) {
      setSelectedFormat(ExportFormat.ADMIN);
    }

    setSelectedToolset(originalToolset);
    setIsSkipRefresh(false);
  }, [isEditorEnabled, originalToolset]);

  const onChangeToolset = useCallback(
    (entity: Toolset, skipRefresh?: boolean) => {
      setSelectedToolset(entity);
      setIsSkipRefresh(!!skipRefresh);
    },
    [setSelectedToolset],
  );

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
        dispatch({ type: ValidationActionType.Reset });
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Toolsets, t),
            getUpdateNotificationDescription(ApplicationRoute.Toolsets, selectedToolset.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
      setIsModalOpen(false);
    });
  }, [selectedFormat, selectedToolset, originalToolset.name, etag, dispatch, showNotification, t, router]);

  const onTryToSave = useCallback(() => {
    if (
      selectedFormat !== ExportFormat.CORE &&
      isDisableRole(selectedToolset as EntityRoleLimits) &&
      !isEditorEnabled
    ) {
      setIsModalOpen(true);
    } else {
      onSave();
    }
  }, [isEditorEnabled, onSave, selectedFormat, selectedToolset]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.Toolsets}
        entity={selectedToolset}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onTryToSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeToolset}
      >
        <AuthButtons selectedToolset={selectedToolset} isUserLevel={isUserLevel} oAuthCode={oAuthCode} />
      </SimpleEntityHeader>

      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            entity={selectedToolset}
            setSelectedEntity={setSelectedToolset}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent
            activeTab={activeTab}
            isSkipRefresh={isSkipRefresh}
            selectedToolset={selectedToolset}
            originalToolset={originalToolset}
            names={names}
            onChange={onChangeToolset}
            roles={roles}
            selectedFormat={selectedFormat}
          />
        )}
      </div>

      {isModalOpen && (
        <EntityRolesModal
          onConfirm={() => onSave()}
          onClose={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ToolsetView;
