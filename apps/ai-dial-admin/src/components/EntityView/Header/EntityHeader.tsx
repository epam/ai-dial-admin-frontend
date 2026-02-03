'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialTabs } from '@epam/ai-dial-ui-kit';
import { cloneDeep } from 'lodash';

import HeaderButtons from '@/src/components/EntityView/Header/HeaderButtons';
import EntityJsonEditor from '@/src/components/EntityView/JsonEditor/JsonEditor';
import { ModalType } from '@/src/components/EntityView/Modals/constants';
import EntityViewModals from '@/src/components/EntityView/Modals/EntityViewModals';
import { isDisableRole } from '@/src/components/EntityView/Roles/utils';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { DialAttachmentData } from '@/src/models/attachment-data';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { BaseEntity, EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { ServerActionResponse } from '@/src/models/server-action';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getViewTabs } from '@/src/utils/tabs/utils';
import {
  VisualizerConnectorEvents,
  VisualizerConnectorRequest,
  VisualizerConnectorRequests,
} from '@epam/ai-dial-shared';
import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';
import ViewContent from './Content/ViewContent';
import { getViewHeaderClassName } from '@/src/utils/entities/view';
import { getAppRunner } from '@/src/components/Applications/ParametersTab/utils';
import HeaderTabs from './HeaderTabs';
import ReadonlyId from '../../BaseControls/Id/ReadonlyId';

interface Props {
  view: ApplicationRoute;
  isEditorEnabled: boolean;
}

const EntityHeader: FC<Props> = ({ view, isEditorEnabled }) => {
  const t = useI18n();

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);

  // const { dispatch } = useSaveValidationContext();

  // const router = useRouter();
  // const { showNotification } = useNotification();

  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [modalType, setModalType] = useState<ModalType>();

  // const [nextTab, setNextTab] = useState<string>();
  // const [selectedEntity, setSelectedEntity] = useState(cloneDeep(originalEntity));
  // const [isChanged, setIsChanged] = useState(false);
  // const [isIframeChanged, setIsIframeChanged] = useState(false);
  // const [isSkipRefresh, setIsSkipRefresh] = useState(true);
  // const [isJsonEditorEnabled, setIsJsonEditorEnabled] = useState(false);
  // const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.ADMIN);
  // const [coreEntity, setCoreEntity] = useState<BaseEntity | null>(null);
  // const [key, setKey] = useState(0);

  // const { visualizerConnector } = useAppContext();
  // const isHideJsonSelector = useMemo(() => {
  //   const scheme = getAppRunner(selectedEntity as DialApplication, applicationSchemes);

  //   return (
  //     activeTab === EntityViewTab.Parameters &&
  //     view === ApplicationRoute.Applications &&
  //     (scheme?.['dial:applicationTypeEditorUrl'] || (selectedEntity as DialApplication).editorUrl)
  //   );
  // }, [activeTab, applicationSchemes, selectedEntity, view]);

  // useEffect(() => {
  //   const name = (originalEntity as { name: string })?.name;
  //   if (!coreEntity && name) {
  //     getCoreEntity(name).then((data) => {
  //       setCoreEntity(data.response as BaseEntity);
  //     });
  //   }
  // }, [coreEntity, getCoreEntity, originalEntity, view]);

  // useEffect(() => {
  //   setSelectedEntity(
  //     selectedFormat === ExportFormat.CORE ? cloneDeep(coreEntity as BaseEntity) : cloneDeep(originalEntity),
  //   );
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [selectedFormat, originalEntity]);

  // const handleModalClose = useCallback(() => {
  //   setIsModalOpen(false);
  //   setModalType(void 0);
  // }, []);

  // const handleModalOpen = useCallback((modalType: ModalType) => {
  //   setModalType(modalType);
  //   setIsModalOpen(true);
  // }, []);

  // const handleMessage = useCallback(
  //   (event: MessageEvent<VisualizerConnectorRequest>) => {
  //     if (event.data?.type?.split('/')[1] !== VisualizerConnectorEvents.sendMessage) return;
  //     setIsIframeChanged((event.data as { payload: { isChanged: boolean } }).payload.isChanged);
  //   },
  //   [setIsIframeChanged],
  // );

  // const sendMessage = useCallback(async (visualizer?: VisualizerConnector | null) => {
  //   const messagePayload: DialAttachmentData = {
  //     mimeType: APPLICATION_JSON_TYPE,
  //     visualizerData: {
  //       saveChanges: true,
  //       layout: { width: 0, height: 0 },
  //     },
  //   };
  //   visualizer?.send(VisualizerConnectorRequests.sendVisualizeData, messagePayload);
  // }, []);

  // useEffect(() => {
  //   const isEqualAdminEntity = isEqualSkippingUndefined(selectedEntity, originalEntity);
  //   const isEqualCoreEntity = isEqualSkippingUndefined(selectedEntity, coreEntity);

  //   setIsChanged(selectedFormat === ExportFormat.CORE ? !isEqualCoreEntity : !isEqualAdminEntity);
  // }, [selectedEntity, originalEntity, coreEntity, selectedFormat]);

  // useEffect(() => {
  //   window.addEventListener('message', handleMessage);
  //   return () => window.removeEventListener('message', handleMessage);
  // }, [handleMessage]);

  // const onDiscard = useCallback(() => {
  //   if (isJsonEditorEnabled) {
  //     dispatch({ type: ValidationActionType.SetJsonEditor, errors: [] });
  //     setIsChanged(false);
  //     setSelectedFormat(ExportFormat.ADMIN);
  //     // TODO: Revisit solution
  //     // Due to we can't set invalid JSON as variable, we can't update entity in error state.
  //     // Force JSON Editor re-render to show originalEntity on discard.
  //     setKey((prevKey) => prevKey + 1);
  //   }
  //   dispatch({ type: ValidationActionType.Reset });
  //   setSelectedEntity(cloneDeep(originalEntity));
  //   setIsSkipRefresh(false);
  // }, [isJsonEditorEnabled, originalEntity, dispatch]);

  // const onSave = useCallback(() => {
  //   const req =
  //     selectedFormat === ExportFormat.CORE
  //       ? updateCoreEntity(selectedEntity as Record<string, unknown>, originalEntity.name || '', etag)
  //       : updateEntity(selectedEntity, etag);

  //   req.then((res) => {
  //     if (res.success) {
  //       dispatch({ type: ValidationActionType.Reset });
  //       setCoreEntity(null);
  //       showNotification(
  //         getSuccessNotification(
  //           getUpdateNotificationTitle(view, t),
  //           getUpdateNotificationDescription(view, selectedEntity.name, t),
  //         ),
  //       );
  //       router.refresh();
  //     } else {
  //       showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
  //     }
  //   });
  // }, [
  //   selectedFormat,
  //   updateCoreEntity,
  //   selectedEntity,
  //   originalEntity.name,
  //   etag,
  //   updateEntity,
  //   dispatch,
  //   showNotification,
  //   view,
  //   t,
  //   router,
  // ]);

  // const onTryToSave = useCallback(() => {
  //   if (
  //     (view === ApplicationRoute.Models || view === ApplicationRoute.Applications) &&
  //     selectedFormat !== ExportFormat.CORE &&
  //     isDisableRole(selectedEntity as EntityRoleLimits)
  //   ) {
  //     handleModalOpen(ModalType.emptyRoles);
  //   } else {
  //     onSave();
  //   }
  // }, [handleModalOpen, selectedFormat, onSave, selectedEntity, view]);

  // const onChangeEntity = useCallback(
  //   (entity: BaseEntity, skipRefresh?: boolean) => {
  //     setSelectedEntity(entity);
  //     setIsSkipRefresh(!!skipRefresh);
  //   },
  //   [setSelectedEntity],
  // );

  // const onToggleJsonEditor = useCallback(() => {
  //   setSelectedEntity(cloneDeep(originalEntity));
  //   setSelectedFormat(ExportFormat.ADMIN);

  //   setIsJsonEditorEnabled((prev) => !prev);
  // }, [originalEntity]);

  // const changeTab = useCallback(() => {
  //   setActiveTab(nextTab as EntityViewTab);
  //   setNextTab(void 0);
  // }, [nextTab]);

  const onChangeActiveTab = useCallback(
    (tab: string) => {
      // if (tab === EntityViewTab.Parameters && isChanged && view === ApplicationRoute.Applications) {
      //   setNextTab(tab);
      //   handleModalOpen(ModalType.entity);
      // } else if (
      //   activeTab === EntityViewTab.Parameters &&
      //   (isIframeChanged || isChanged) &&
      //   (view === ApplicationRoute.Applications || view === ApplicationRoute.AssetsApplications)
      // ) {
      //   setNextTab(tab);
      //   handleModalOpen(ModalType.parameters);
      // } else {
      //   setActiveTab(tab as EntityViewTab);
      // }
    },
    [activeTab, handleModalOpen, isChanged, isIframeChanged, view],
  );

  return (
    <div className="flex flex-col">
      <div className={getViewHeaderClassName(isEditorEnabled)}>
        <ReadonlyId value="AAAA" />
        <HeaderButtons
          view={view}
          activeTab={activeTab}
          entity={selectedEntity}
          isChanged={isChanged}
          onSave={onTryToSave}
          onDiscard={onDiscard}
          onRemove={removeEntity}
          isJsonEditorEnabled={isEditorEnabled}
          onToggleJsonEditor={onToggleJsonEditor}
          selectedFormat={selectedFormat}
          onChangeSelectedFormat={setSelectedFormat}
          etag={etag}
          onChangeEntity={onChangeEntity}
          onHideFormatSelector={() => isHideJsonSelector}
        />
      </div>
      <HeaderTabs
        isEditorEnabled={isEditorEnabled}
        view={view}
        activeTab={activeTab}
        onChangeActiveTab={onChangeActiveTab}
      />
    </div>
  );
};

export default EntityHeader;
