'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconRefresh } from '@tabler/icons-react';
import classNames from 'classnames';
import { cloneDeep } from 'lodash';
import { ButtonVariant, DialButton, DialConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { removeKey, updateKey } from '@/src/app/[lang]/keys/actions';
import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import { getRelevantRolesForKey } from '@/src/components/AddEntitiesTab/utils';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { auditTabs, EntityViewTab, propertiesTabs, rolesTabs } from '@/src/components/EntityView/View/utils';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ButtonsI18nKey, EntitiesI18nKey, KeysI18nKey, RolesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { DialRole } from '@/src/models/dial/role';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { TabModel } from '@/src/models/tab';
import { ApplicationRoute } from '@/src/types/routes';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import KeyProperties from './Properties/Properties';
import KeyRotateModal from '../Modals/KeyRotateModal';
import KeyViewHeader from './Header/Header';
import { getCoreEntity } from '@/src/app/[lang]/export-config/actions';
import { ExportFormat } from '@/src/types/export';
import {
  getEntityFromFile,
  getExportType,
  getFileFromEntity,
} from '@/src/components/EntityView/View/core-entity-utils';
import { updateCoreEntity } from '@/src/app/[lang]/import-config/actions';

interface Props {
  originalKey: DialKey;
  names: string[];
  keys: string[];
  etag: string;
  roles: DialRole[];
}

const KeyView: FC<Props> = ({ originalKey, etag, names, keys, roles }) => {
  const t = useI18n() as (str: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const tabs: TabModel[] = [propertiesTabs(t), rolesTabs(t), auditTabs(t)];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isOpenConfirmModal, setIsOpenConfirmModal] = useState(false);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(cloneDeep(originalKey));
  const [isChanged, setIsChanged] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [key, setKey] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.ADMIN);
  const [coreKey, setCoreKey] = useState<DialKey | null>(null);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

  useEffect(() => {
    const name = originalKey?.name;
    if (!coreKey && name) {
      getCoreEntity(name, getExportType(ApplicationRoute.Keys)).then((data) => {
        setCoreKey(getEntityFromFile(ApplicationRoute.Keys, name, data) as DialKey);
      });
    }
  }, [coreKey, originalKey]);

  useEffect(() => {
    setSelectedKey(selectedFormat === ExportFormat.CORE ? cloneDeep(coreKey as DialKey) : cloneDeep(originalKey));
  }, [selectedFormat, coreKey, originalKey]);

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
    if (jsonEditorEnabled) {
      dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
      setIsChanged(false);
      setSelectedFormat(ExportFormat.ADMIN);
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedKey(originalKey);
  }, [jsonEditorEnabled, originalKey, dispatch]);

  const onChangeKey = useCallback(
    (entity: DialKey) => {
      setSelectedKey(entity);
    },
    [setSelectedKey],
  );

  const toggleJsonEditor = useCallback(() => {
    setSelectedFormat(ExportFormat.ADMIN);
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

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
        ? updateCoreEntity(getFileFromEntity(ApplicationRoute.Keys, selectedKey))
        : updateKey(selectedKey, etag);

    req.then((res) => {
      if (res.success) {
        setCoreKey(null);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedFormat, etag, setIsOpenConfirmModal, selectedKey, router, showNotification]);

  const onRotateKey = useCallback(
    (key: DialKey) => {
      setIsRotateModalOpen(false);
      updateKey(key, etag).then((res) => {
        if (res.success) {
          router.refresh();
          showNotification(
            getSuccessNotification(t(KeysI18nKey.RotateKeySuccessTitle), t(KeysI18nKey.RotateKeySuccessDescription)),
          );
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
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
        <div className={headerClassName}>
          <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
          <HeaderButtons
            view={ApplicationRoute.Keys}
            entity={selectedKey}
            isChanged={isChanged}
            onDiscard={onDiscard}
            removeEntity={removeKey}
            onSave={onTryToSaveKey}
            jsonEditorEnabled={jsonEditorEnabled}
            toggleJsonEditor={toggleJsonEditor}
            selectedFormat={selectedFormat}
            setSelectedFormat={setSelectedFormat}
          >
            <DialButton
              variant={ButtonVariant.Primary}
              title={t(ButtonsI18nKey.Rotate)}
              iconBefore={<IconRefresh {...BASE_ICON_PROPS} />}
              onClick={() => setIsRotateModalOpen(true)}
            />
          </HeaderButtons>
        </div>
        <div className="flex-1 overflow-auto mt-3 min-h-0">
          {jsonEditorEnabled ? (
            <EntityJsonEditor
              key={key}
              entity={selectedKey}
              setSelectedEntity={setSelectedKey}
              setIsChanged={setIsChanged}
            />
          ) : (
            <>
              {activeTab === EntityViewTab.Properties && (
                <div className="h-full flex flex-col pt-3 divide-y divide-primary w-full">
                  <KeyViewHeader selectedKey={selectedKey} />
                  <div className="pt-6 w-full">
                    <div className="lg:w-[35%]">
                      <KeyProperties
                        entity={selectedKey}
                        names={names}
                        keys={keys}
                        onChangeKey={onChangeKey}
                        isKeyImmutable={true}
                      ></KeyProperties>
                    </div>
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
          )}
        </div>
      </div>

      {isOpenConfirmModal &&
        createPortal(
          <DialConfirmationPopup
            open={isOpenConfirmModal}
            description={t(KeysI18nKey.SaveWithoutRolesDescriptions)}
            title={t(KeysI18nKey.SaveWithoutRoles)}
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
