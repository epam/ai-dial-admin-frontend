'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cloneDeep } from 'lodash';

import { getCoreRole, removeRole, updateCoreRole, updateRole } from '@/src/app/[lang]/roles/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplication } from '@/src/models/dial/application';
import { DialKey } from '@/src/models/dial/key';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { DialRoute } from '@/src/models/dial/route';
import { Toolset } from '@/src/models/dial/toolset';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getRoleTabs } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';
import DiscardModal from '@/src/components//EntityView/Modals/Discard/Discard';

interface Props {
  originalRole: DialRole;
  names: string[];
  models: DialModel[];
  applications: DialApplication[];
  toolsets?: Toolset[];
  routes?: DialRoute[];
  keys: DialKey[];
  etag: string;
}

const RolesView: FC<Props> = ({ originalRole, etag, keys, ...props }) => {
  const t = useI18n();
  const router = useRouter();
  const getReqRef = useRef(useProtectedRequest());
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();

  const tabs = getRoleTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedRole, setSelectedRole] = useState(cloneDeep(originalRole));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);

  const [isSkipRefresh, setIsSkipRefresh] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.ADMIN);
  const [coreRole, setCoreRole] = useState<DialKey | null>(null);
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);

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
    const name = (originalRole as { name: string })?.name;
    if (!coreRole && name) {
      getReqRef.current(getCoreRole, name).then((data) => {
        setCoreRole(data.response);
      });
    }
  }, [coreRole, originalRole]);

  useEffect(() => {
    setSelectedRole(selectedFormat === ExportFormat.CORE ? cloneDeep(coreRole as DialRole) : cloneDeep(originalRole));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, originalRole]);

  useEffect(() => {
    const isEqualAdminRole = isEqualSkippingUndefined(originalRole, selectedRole);
    const isEqualCoreRole = isEqualSkippingUndefined(selectedRole, coreRole);

    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreRole : !isEqualAdminRole);
  }, [selectedFormat, originalRole, selectedRole, coreRole]);

  const onDiscard = useCallback(() => {
    if (isEditorEnabled) {
      setSelectedFormat(ExportFormat.ADMIN);
    }

    setIsSkipRefresh(false);
    setSelectedRole(originalRole);
  }, [isEditorEnabled, originalRole]);

  const onChangeRole = useCallback(
    (entity: DialRole, skipRefresh?: boolean) => {
      setSelectedRole(entity);
      setIsSkipRefresh(!!skipRefresh);
    },
    [setSelectedRole],
  );

  const onSave = useCallback(() => {
    const req =
      selectedFormat === ExportFormat.CORE
        ? getReqRef.current(updateCoreRole, selectedRole as Record<string, unknown>, originalRole.name || '', etag)
        : getReqRef.current(updateRole, selectedRole, etag);

    req.then((res) => {
      if (res.success) {
        dispatch({ type: ValidationActionType.Reset });
        setCoreRole(null);
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Roles, t),
            getUpdateNotificationDescription(ApplicationRoute.Roles, selectedRole.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedFormat, selectedRole, originalRole.name, etag, dispatch, showNotification, t, router]);

  const onTryToDiscard = useCallback(() => {
    setIsDiscardModalOpen(true);
  }, []);

  const onDiscardModalConfirm = useCallback(() => {
    onDiscard();
    setIsDiscardModalOpen(false);
  }, [onDiscard]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <SimpleEntityHeader
        view={ApplicationRoute.Roles}
        entity={selectedRole}
        isChanged={isChanged}
        onDiscard={onTryToDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removeRole}
      />
      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor entity={selectedRole} setSelectedEntity={setSelectedRole} setIsChanged={setIsChanged} />
        ) : (
          <>
            <TabsContent
              isSkipRefresh={isSkipRefresh}
              activeTab={activeTab}
              selectedFormat={selectedFormat}
              selectedRole={selectedRole}
              keys={keys}
              onChange={onChangeRole}
              {...props}
            />
            {isDiscardModalOpen && (
              <DiscardModal
                onConfirm={onDiscardModalConfirm}
                onClose={() => setIsDiscardModalOpen(false)}
                onCancel={() => setIsDiscardModalOpen(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RolesView;
