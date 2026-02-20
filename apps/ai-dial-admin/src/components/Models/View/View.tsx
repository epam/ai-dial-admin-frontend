'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { cloneDeep } from 'lodash';

import { getCoreModel, removeModel, updateCoreModel, updateModel } from '@/src/app/[lang]/models/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ModalType } from '@/src/components/EntityView/Modals/constants';
import EntityViewModals from '@/src/components/EntityView/Modals/EntityViewModals';
import { isDisableRole } from '@/src/components/EntityView/Roles/utils';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getModelsTabs } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  originalModel: DialModel;
  names: string[];
  etag: string;
  roles?: DialRole[] | null;
  interceptors?: DialInterceptor[] | null;
}

const View: FC<Props> = ({ originalModel, etag, ...props }) => {
  const t = useI18n();
  const { dispatch } = useSaveValidationContext();

  const tabs = getModelsTabs(t);
  const router = useRouter();
  const { showNotification } = useNotification();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>();

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [nextTab, setNextTab] = useState<string>();
  const [selectedModel, setSelectedModel] = useState(cloneDeep(originalModel));
  const [isChanged, setIsChanged] = useState(false);
  const [isSkipRefresh, setIsSkipRefresh] = useState(true);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.ADMIN);
  const [coreModel, setCoreModel] = useState<DialModel | null>(null);

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
    const name = (originalModel as { name: string })?.name;
    if (!coreModel && name) {
      getCoreModel(name).then((data) => {
        setCoreModel(data.response as DialModel);
      });
    }
  }, [coreModel, originalModel]);

  useEffect(() => {
    setSelectedModel(
      selectedFormat === ExportFormat.CORE ? cloneDeep(coreModel as DialModel) : cloneDeep(originalModel),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, originalModel]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setModalType(void 0);
  }, []);

  const handleModalOpen = useCallback((modalType: ModalType) => {
    setModalType(modalType);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    const isEqualAdmin = isEqualSkippingUndefined(selectedModel, originalModel);
    const isEqualCore = isEqualSkippingUndefined(selectedModel, coreModel);

    setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCore : !isEqualAdmin);
  }, [selectedModel, originalModel, coreModel, selectedFormat]);

  const onDiscard = useCallback(() => {
    if (isEditorEnabled) {
      setSelectedFormat(ExportFormat.ADMIN);
    }
    setSelectedModel(cloneDeep(originalModel));
    setIsSkipRefresh(false);
  }, [isEditorEnabled, originalModel]);

  const onSave = useCallback(() => {
    const req =
      selectedFormat === ExportFormat.CORE
        ? updateCoreModel(selectedModel as Record<string, unknown>, originalModel.name || '', etag)
        : updateModel(selectedModel, etag);

    req.then((res) => {
      if (res.success) {
        dispatch({ type: ValidationActionType.Reset });
        setCoreModel(null);
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.Models, t),
            getUpdateNotificationDescription(ApplicationRoute.Models, selectedModel.name, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedFormat, selectedModel, originalModel.name, etag, dispatch, showNotification, t, router]);

  const onTryToSave = useCallback(() => {
    if (selectedFormat !== ExportFormat.CORE && isDisableRole(selectedModel as EntityRoleLimits)) {
      handleModalOpen(ModalType.emptyRoles);
    } else {
      onSave();
    }
  }, [handleModalOpen, selectedFormat, onSave, selectedModel]);

  const onTryToDiscard = useCallback(() => {
    handleModalOpen(ModalType.discard);
  }, [handleModalOpen]);

  const onChangeModel = useCallback(
    (model: DialModel, skipRefresh?: boolean) => {
      setSelectedModel(model);
      setIsSkipRefresh(!!skipRefresh);
    },
    [setSelectedModel],
  );

  const changeTab = useCallback(() => {
    setActiveTab(nextTab as EntityViewTab);
    setNextTab(void 0);
  }, [nextTab]);

  const onModalConfirm = useCallback(
    (type: ModalType) => {
      if (type === ModalType.entity) {
        onSave();
        handleModalClose();
        changeTab();
      }
      if (type === ModalType.emptyRoles) {
        onSave();
        handleModalClose();
      }
      if (type === ModalType.discard) {
        onDiscard();
        handleModalClose();
      }
    },
    [changeTab, handleModalClose, onSave, onDiscard],
  );

  const onModalCancel = useCallback(
    (type: ModalType) => {
      if (type === ModalType.entity) {
        onDiscard();
        handleModalClose();
        changeTab();
      }

      if (type === ModalType.emptyRoles) {
        handleModalClose();
      }

      if (type === ModalType.discard) {
        handleModalClose();
      }
    },
    [changeTab, handleModalClose, onDiscard],
  );

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
        <SimpleEntityHeader
          view={ApplicationRoute.Models}
          entity={selectedModel}
          isChanged={isChanged}
          onDiscard={onTryToDiscard}
          onSave={onTryToSave}
          tabs={tabs}
          jsonConfiguration={jsonConfiguration}
          activeTab={activeTab}
          onChangeActiveTab={setActiveTab}
          onRemove={removeModel}
        />

        <div className="flex-1 overflow-auto min-h-0">
          {isEditorEnabled ? (
            <EntityJsonEditor entity={selectedModel} setSelectedEntity={setSelectedModel} setIsChanged={setIsChanged} />
          ) : (
            <TabsContent
              activeTab={activeTab}
              selectedModel={selectedModel}
              isSkipRefresh={isSkipRefresh}
              onChange={onChangeModel}
              {...props}
            />
          )}
        </div>
      </div>
      <EntityViewModals
        isModalOpen={isModalOpen}
        modalType={modalType}
        handleConfirm={onModalConfirm}
        handleClose={handleModalClose}
        handleCancel={onModalCancel}
      />
    </>
  );
};

export default View;
