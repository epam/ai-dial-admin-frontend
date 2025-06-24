'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { IconRefresh } from '@tabler/icons-react';
import classNames from 'classnames';
import { cloneDeep, isEqual } from 'lodash';
import { useRouter } from 'next/navigation';

import { removeKey, updateKey } from '@/src/app/[lang]/keys/actions';
import AddEntitiesView from '@/src/components/AddEntitiesTab/AddEntitiesView';
import { getRelevantRolesForKey } from '@/src/components/AddEntitiesTab/AddEntitiesView.utils';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import Button from '@/src/components/Common/Button/Button';
import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import { SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { EntityViewTab, propertiesTabs, rolesTabs } from '@/src/components/EntityView/entity-view';
import EntityViewHeaderButtons from '@/src/components/EntityView/EntityViewHeaderButtons';
import JSONEditor from '@/src/components/JSONEditor/JSONEditor';
import { ButtonsI18nKey, EntitiesI18nKey, KeysI18nKey, RolesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialKey } from '@/src/models/dial/key';
import { DialRole } from '@/src/models/dial/role';
import { TabModel } from '@/src/models/tab';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import KeyProperties from './KeyProperties';
import KeyRotateModal from './KeyRotateModal';
import KeyViewHeader from './KeyViewHeader';

interface Props {
  originalKey: DialKey;
  names: string[];
  keys: string[];
  roles: DialRole[];
}

const KeyView: FC<Props> = ({ originalKey, names, keys, roles }) => {
  const t = useI18n() as (str: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();

  const tabs: TabModel[] = [propertiesTabs(t), rolesTabs(t)];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [confirmModalState, setConfirmModalState] = useState(PopUpState.Closed);
  const [rotateModalState, setRotateModalState] = useState(PopUpState.Closed);
  const [selectedKey, setSelectedKey] = useState(cloneDeep(originalKey));
  const [isChanged, setIsChanged] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [jsonErrors, setJsonErrors] = useState<JSONEditorError[]>([]);
  const [errorNotifications, setErrorNotifications] = useState<JSONEditorErrorNotification[]>([]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setSelectedKey(cloneDeep(originalKey));
  }, [originalKey]);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

  useEffect(() => {
    setIsChanged(!isEqual(originalKey, selectedKey));
  }, [selectedKey, originalKey]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      setActiveTab(tab as EntityViewTab);
    },
    [setActiveTab],
  );

  const onDiscard = useCallback(() => {
    if (jsonEditorEnabled) {
      setJsonErrors([]);
      setIsChanged(false);
      // Due to we can't set invalid JSON as variable, we can't update entity in error state.
      // Force JSON Editor re-render to show originalEntity on discard.
      setKey((prevKey) => prevKey + 1);
    }
    setSelectedKey(originalKey);
  }, [setSelectedKey, originalKey, jsonEditorEnabled]);

  const onChangeKey = useCallback(
    (entity: DialKey) => {
      setSelectedKey(entity);
    },
    [setSelectedKey],
  );

  const toggleJsonEditor = useCallback(() => {
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
    setConfirmModalState(PopUpState.Closed);
    updateKey(selectedKey).then((res) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [setConfirmModalState, selectedKey, router, showNotification]);

  const onRotateKey = useCallback(
    (key: DialKey) => {
      setRotateModalState(PopUpState.Closed);
      updateKey(key).then((res) => {
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
    [router, showNotification, t],
  );

  const onTryToSaveKey = useCallback(() => {
    if (selectedKey.roles == null || selectedKey.roles.length === 0) {
      setConfirmModalState(PopUpState.Opened);
    } else {
      onSaveKey();
    }
  }, [selectedKey.roles, setConfirmModalState, onSaveKey]);

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
        <div className={headerClassName}>
          <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
          <EntityViewHeaderButtons
            view={ApplicationRoute.Keys}
            entity={selectedKey}
            isChanged={isChanged}
            onDiscard={onDiscard}
            removeEntity={removeKey}
            onSave={onTryToSaveKey}
            jsonEditorEnabled={jsonEditorEnabled}
            toggleJsonEditor={toggleJsonEditor}
            jsonErrors={jsonErrors}
            setErrorNotifications={setErrorNotifications}
          >
            <Button
              cssClass={`primary`}
              title={t(ButtonsI18nKey.Rotate)}
              iconBefore={<IconRefresh {...BASE_ICON_PROPS} />}
              onClick={() => setRotateModalState(PopUpState.Opened)}
            />
          </EntityViewHeaderButtons>
        </div>
        <div className="flex-1 overflow-auto mt-3 min-h-0">
          {jsonEditorEnabled ? (
            <JSONEditor
              key={key}
              model={selectedKey}
              errorNotifications={errorNotifications}
              setSelectedEntity={setSelectedKey}
              setIsChanged={setIsChanged}
              setJsonErrors={setJsonErrors}
            />
          ) : (
            <>
              {activeTab === EntityViewTab.Properties && (
                <div className="h-full flex flex-col pt-3 divide-y divide-primary w-full">
                  <KeyViewHeader selectedKey={selectedKey} />
                  <div className="mt-8 pt-8">
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
            </>
          )}
        </div>
      </div>

      {confirmModalState === PopUpState.Opened &&
        createPortal(
          <ConfirmationModal
            description={t(KeysI18nKey.SaveWithoutRolesDescriptions)}
            heading={t(KeysI18nKey.SaveWithoutRoles)}
            onConfirm={() => onSaveKey()}
            modalState={confirmModalState}
            onClose={() => setConfirmModalState(PopUpState.Closed)}
            confirmLabel={t(ButtonsI18nKey.Save)}
            cancelLabel={t(ButtonsI18nKey.ContinueEditing)}
          />,
          document.body,
        )}

      {rotateModalState === PopUpState.Opened &&
        createPortal(
          <KeyRotateModal
            modalState={rotateModalState}
            selectedKey={selectedKey}
            keys={keys}
            onConfirm={(key) => onRotateKey(key)}
            onClose={() => setRotateModalState(PopUpState.Closed)}
          />,
          document.body,
        )}
    </>
  );
};

export default KeyView;
