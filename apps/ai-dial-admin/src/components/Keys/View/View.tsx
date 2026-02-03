'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialPrimaryButton, DialConfirmationPopup } from '@epam/ai-dial-ui-kit';
import { IconRefresh } from '@tabler/icons-react';
import { cloneDeep } from 'lodash';

import { getCoreKey, removeKey, updateCoreKey, updateKey } from '@/src/app/[lang]/keys/actions';
import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import { getRelevantRolesForKey } from '@/src/components/AddEntitiesTab/utils';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey, KeysI18nKey, RolesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { DialRole } from '@/src/models/dial/role';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getKeyTabs } from '@/src/utils/tabs/utils';
import KeyRotateModal from '../Modals/KeyRotateModal';
import KeyViewHeader from './Header/Header';
import KeyProperties from './Properties/Properties';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
import Tabs from '@/src/components/EntityHeaderControls/Tabs/HeaderTabs';

interface Props {
  originalKey: DialKey;
  names: string[];
  keys: string[];
  etag: string;
  roles: DialRole[];
}

const KeyView: FC<Props> = ({ originalKey, etag, names, keys, roles }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());
  const { dispatch } = useSaveValidationContext();
  const tabs = getKeyTabs(t);

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(cloneDeep(originalKey));
  const [isChanged, setIsChanged] = useState(false);
  const [isJsonEditorEnabled, setIsJsonEditorEnabled] = useState(false);
  const [key, setKey] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState(ExportFormat.ADMIN);
  const [coreKey, setCoreKey] = useState<DialKey | null>(null);

  useEffect(() => {
    const name = originalKey?.name;
    if (!coreKey && name) {
      getReqRef.current(getCoreKey, name).then((data) => {
        setCoreKey(data.response);
      });
    }
  }, [coreKey, originalKey]);

  useEffect(() => {
    setSelectedKey(selectedFormat === ExportFormat.CORE ? cloneDeep(coreKey as DialKey) : cloneDeep(originalKey));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, originalKey]);

  useEffect(() => {
    const isEqualAdminKey = isEqualSkippingUndefined(originalKey, selectedKey);
    const isEqualCoreKey = isEqualSkippingUndefined(selectedKey, coreKey);

    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreKey : !isEqualAdminKey);
  }, [selectedFormat, originalKey, selectedKey, coreKey]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onDiscard = useCallback(() => {
    if (isJsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      setSelectedFormat(ExportFormat.ADMIN);
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedKey(originalKey);
  }, [isJsonEditorEnabled, originalKey, dispatch]);

  const onChangeKey = useCallback(
    (entity: DialKey) => {
      setSelectedKey(entity);
    },
    [setSelectedKey],
  );

  const onToggleJsonEditor = useCallback(() => {
    setSelectedKey(cloneDeep(originalKey));
    setSelectedFormat(ExportFormat.ADMIN);

    setIsJsonEditorEnabled((prev) => !prev);
  }, [originalKey]);

  const onAddRoles = useCallback(
    (rows: EntitiesGridData[]) => {
      const newRoles = rows.map((row) => row.name as string);
      onChangeKey({
        ...selectedKey,
        roles: [...(selectedKey.roles || []), ...newRoles],
      });
    },
    [onChangeKey, selectedKey],
  );

  const onRemoveRole = useCallback(
    (row: EntitiesGridData) => {
      const roleToRemove = row.name;
      const newKey = cloneDeep(selectedKey);
      newKey.roles = newKey.roles?.filter((role) => role !== roleToRemove);
      onChangeKey(newKey);
    },
    [onChangeKey, selectedKey],
  );

  const onSaveKey = useCallback(() => {
    setIsOpenConfirmModal(false);
    const req =
      selectedFormat === ExportFormat.CORE
        ? getReqRef.current(updateCoreKey, selectedKey as Record<string, unknown>, originalKey.name || '', etag)
        : getReqRef.current(updateKey, selectedKey, etag);

    req.then((res) => {
      if (res.success) {
        setCoreKey(null);
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Keys, t),
            getUpdateNotificationDescription(ApplicationRoute.Keys, selectedKey.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedFormat, selectedKey, originalKey.name, etag, showNotification, t, router]);

  const onRotateKey = useCallback(
    (key: DialKey) => {
      setIsRotateModalOpen(false);
      getReqRef.current(updateKey, key, etag).then((res) => {
        if (res.success) {
          router.refresh();
          showNotification(
            getSuccessNotification(t(KeysI18nKey.RotateKeySuccessTitle), t(KeysI18nKey.RotateKeySuccessDescription)),
          );
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [router, showNotification, t, etag],
  );

  const onTryToSaveKey = useCallback(() => {
    if ((selectedKey?.roles == null || selectedKey.roles.length === 0) && selectedFormat !== ExportFormat.CORE) {
      setIsOpenConfirmModal(true);
    } else {
      onSaveKey();
    }
  }, [selectedKey, selectedFormat, onSaveKey]);

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
        <div className={getViewHeaderClassName(isJsonEditorEnabled)}>
          <Tabs
            tabs={tabs}
            isEditorEnabled={isJsonEditorEnabled}
            activeTab={activeTab}
            onChangeActiveTab={onChangeActiveTab}
          />
          <HeaderButtons
            view={ApplicationRoute.Keys}
            entity={selectedKey}
            isChanged={isChanged}
            onDiscard={onDiscard}
            onRemove={removeKey}
            onSave={onTryToSaveKey}
            isEditorEnabled={isJsonEditorEnabled}
            onToggleEditor={onToggleJsonEditor}
            selectedFormat={selectedFormat}
            onChangeSelectedFormat={setSelectedFormat}
          >
            <DialPrimaryButton
              label={t(ButtonsI18nKey.Rotate)}
              iconBefore={<IconRefresh {...BASE_BUTTON_ICON_PROPS} />}
              onClick={() => setIsRotateModalOpen(true)}
            />
          </HeaderButtons>
        </div>
        <div className="flex-1 overflow-auto min-h-0">
          {isJsonEditorEnabled ? (
            <EntityJsonEditor
              key={key}
              entity={selectedKey}
              setSelectedEntity={setSelectedKey}
              setIsChanged={setIsChanged}
            />
          ) : (
            selectedFormat === ExportFormat.ADMIN && (
              <>
                {activeTab === EntityViewTab.Properties && (
                  <div className="h-full flex flex-col divide-y divide-primary w-full">
                    <KeyViewHeader selectedKey={selectedKey} />
                    <div className="flex-1 min-h-0 pt-8">
                      <KeyProperties
                        entity={selectedKey}
                        names={names}
                        keys={keys}
                        onChangeKey={onChangeKey}
                        isKeyImmutable={true}
                      ></KeyProperties>
                    </div>
                  </div>
                )}
                {activeTab === EntityViewTab.Roles && (
                  <AddEntitiesView
                    viewTitle={t(TabsI18nKey.Roles)}
                    customColumns={SIMPLE_ENTITY_COLUMNS}
                    modalTitle={t(RolesI18nKey.AddRoles)}
                    emptyDataTitle={t(EntitiesI18nKey.NoRoles)}
                    roles={roles}
                    onAdd={onAddRoles}
                    onRemove={onRemoveRole}
                    getRelevantDataForEntity={getRelevantRolesForKey.bind(this, selectedKey)}
                  />
                )}
                {activeTab === EntityViewTab.Audit && <EntityAudit entity={selectedKey} view={ApplicationRoute.Keys} />}
              </>
            )
          )}
        </div>
      </div>

      {isOpenConfirmModal &&
        createPortal(
          <DialConfirmationPopup
            open={isOpenConfirmModal}
            description={t(KeysI18nKey.SaveWithoutRolesDescriptions)}
            header={t(KeysI18nKey.SaveWithoutRoles)}
            onConfirm={() => onSaveKey()}
            onClose={() => setIsOpenConfirmModal(false)}
            confirmLabel={t(ButtonsI18nKey.Save)}
            cancelLabel={t(ButtonsI18nKey.ContinueEditing)}
          />,
          document.body,
        )}

      {isRotateModalOpen &&
        createPortal(
          <KeyRotateModal
            isModalOpen={isRotateModalOpen}
            selectedKey={selectedKey}
            keys={keys}
            onConfirm={(key) => onRotateKey(key)}
            onClose={() => setIsRotateModalOpen(false)}
          />,
          document.body,
        )}
    </>
  );
};

export default KeyView;
