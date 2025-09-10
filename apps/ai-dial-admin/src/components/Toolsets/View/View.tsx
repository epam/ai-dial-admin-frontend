'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'classnames';
import { cloneDeep } from 'lodash';

import { removeToolset, updateToolset } from '@/src/app/[lang]/toolsets/actions';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import EntityRoles from '@/src/components/EntityView/Roles/Roles';
import { auditTabs, EntityViewTab, propertiesTabs, rolesTabs, toolsTabs } from '@/src/components/EntityView/View/utils';
import Tool from '@/src/components/Toolsets/Tools/Tools';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import { Toolset } from '@/src/models/dial/toolset';
import { TabModel } from '@/src/models/tab';
import { JSONEditorErrorNotification } from '@/src/types/editor';
import { ApplicationRoute } from '@/src/types/routes';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification } from '@/src/utils/notification';
import ToolsetProperties from './Properties';
import EntityAudit from '@/src/components/EntityView/Audit/EntityAudit';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';
import { isDisableRole } from '@/src/components/EntityView/Roles/utils';
import { PopUpState } from '@/src/types/pop-up';
import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import { ButtonsI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { createPortal } from 'react-dom';

interface Props {
  names: string[];
  roles: DialRole[] | null | undefined;
  originalToolset: Toolset;
}

const ToolsetView: FC<Props> = ({ names, roles, originalToolset }) => {
  const t = useI18n() as (stringToTranslate: string) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();

  const tabs: TabModel[] = [propertiesTabs(t), toolsTabs(t), rolesTabs(t), auditTabs(t)];

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [selectedToolset, setSelectedToolset] = useState(cloneDeep(originalToolset));
  const [isChanged, setIsChanged] = useState(false);
  const [jsonEditorEnabled, setJsonEditorEnabled] = useState<boolean>(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState<boolean>(true);
  const [errorNotifications, setErrorNotifications] = useState<JSONEditorErrorNotification[]>([]);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setSelectedToolset(cloneDeep(originalToolset));
  }, [originalToolset]);

  const headerClassName = classNames(
    'flex flex-row min-h-[34px]',
    jsonEditorEnabled ? 'justify-end' : 'justify-between',
  );

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(originalToolset, selectedToolset));
  }, [selectedToolset, originalToolset]);

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
    setJsonEditorEnabled((prev) => !prev);
  }, [setJsonEditorEnabled]);

  const onSave = useCallback(() => {
    updateToolset(selectedToolset).then((res) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [selectedToolset, router, showNotification]);

  const onTryToSave = useCallback(() => {
    if (isDisableRole(selectedToolset as EntityRoleLimits)) {
      setModalState(PopUpState.Opened);
    } else {
      onSave();
    }
  }, [onSave, selectedToolset]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <div className={headerClassName}>
        <Tabs tabs={tabs} activeTab={activeTab} onClick={onChangeActiveTab} jsonEditorEnabled={jsonEditorEnabled} />
        <HeaderButtons
          view={ApplicationRoute.ApplicationRunners}
          entity={selectedToolset}
          isChanged={isChanged}
          onDiscard={onDiscard}
          onSave={onTryToSave}
          removeEntity={removeToolset}
          jsonEditorEnabled={jsonEditorEnabled}
          toggleJsonEditor={toggleJsonEditor}
          setErrorNotifications={setErrorNotifications}
        />
      </div>
      <div className="flex-1 overflow-auto mt-3 min-h-0">
        {jsonEditorEnabled ? (
          <EntityJsonEditor
            key={key}
            entity={selectedToolset}
            errorNotifications={errorNotifications}
            setSelectedEntity={setSelectedToolset}
            setIsChanged={setIsChanged}
          />
        ) : (
          <>
            {activeTab === EntityViewTab.Properties && (
              <ToolsetProperties names={names} selectedToolset={selectedToolset} onChangeToolset={onChangeToolset} />
            )}

            {activeTab === EntityViewTab.Tools && (
              <Tool
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

            {modalState === PopUpState.Opened &&
              createPortal(
                <ConfirmationModal
                  modalState={modalState}
                  heading={t(RolesI18nKey.SaveWithEmptyRolesTitle)}
                  confirmLabel={t(ButtonsI18nKey.Save)}
                  cancelLabel={t(ButtonsI18nKey.ContinueEditing)}
                  containerClassName="lg:!max-w-[440px]"
                  onConfirm={() => onSave()}
                  onClose={() => setModalState(PopUpState.Closed)}
                  onCancel={() => setModalState(PopUpState.Closed)}
                >
                  <div className="text-secondary small-150 px-6 py-4">
                    <p className="mb-2">{t(RolesI18nKey.SaveWithEmptyRolesDescription)}</p>
                    <p className="small-text-semi">{t(RolesI18nKey.SaveProceedWithConfiguration)}</p>
                  </div>
                </ConfirmationModal>,
                document.body,
              )}
          </>
        )}
      </div>
    </div>
  );
};

export default ToolsetView;
