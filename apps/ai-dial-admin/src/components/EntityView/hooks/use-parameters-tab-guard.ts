'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  VisualizerConnectorEvents,
  VisualizerConnectorRequest,
  VisualizerConnectorRequests,
} from '@epam/ai-dial-shared';
import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';

import { ModalType } from '@/src/components/EntityView/Modals/constants';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { DialAttachmentData } from '@/src/models/attachment-data';
import { EntityViewTab } from '@/src/utils/tabs/utils';

interface Props {
  activeTab: EntityViewTab;
  isChanged: boolean;
  visualizerConnector?: VisualizerConnector | null;
  onSaveEntity: () => void;
  onDiscardEntity: () => void;
  onSetActiveTab: (tab: EntityViewTab) => void;
}

export const useParametersTabGuard = ({
  activeTab,
  isChanged,
  visualizerConnector,
  onSaveEntity,
  onDiscardEntity,
  onSetActiveTab,
}: Props) => {
  const [nextTab, setNextTab] = useState<EntityViewTab>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>();
  const [isIframeChanged, setIsIframeChanged] = useState(false);

  const onModalOpen = useCallback((type: ModalType) => {
    setModalType(type);
    setIsModalOpen(true);
  }, []);

  const onModalClose = useCallback(() => {
    setIsModalOpen(false);
    setModalType(void 0);
  }, []);

  const onChangeTab = useCallback(() => {
    if (nextTab) {
      onSetActiveTab(nextTab);
      setNextTab(void 0);
    }
  }, [nextTab, onSetActiveTab]);

  const onSendSaveParametersMessage = useCallback(() => {
    const messagePayload: DialAttachmentData = {
      mimeType: APPLICATION_JSON_TYPE,
      visualizerData: {
        saveChanges: true,
        layout: { width: 0, height: 0 },
      },
    };

    visualizerConnector?.send(VisualizerConnectorRequests.sendVisualizeData, messagePayload);
  }, [visualizerConnector]);

  const onModalCancel = useCallback(
    (type: ModalType) => {
      if (type === ModalType.entity) {
        onDiscardEntity();
        onModalClose();
        onChangeTab();
      }
      if (type === ModalType.parameters) {
        onModalClose();
        onChangeTab();
      }
    },
    [onChangeTab, onDiscardEntity, onModalClose],
  );

  const onModalConfirm = useCallback(
    (type: ModalType) => {
      if (type === ModalType.entity) {
        onSaveEntity();
        onModalClose();
        onChangeTab();
      }
      if (type === ModalType.parameters) {
        onSendSaveParametersMessage();
        onModalClose();
        // wait for iframe save before switching tabs
        setTimeout(() => {
          onChangeTab();
        }, 2000);
      }
    },
    [onChangeTab, onModalClose, onSaveEntity, onSendSaveParametersMessage],
  );

  const onChangeActiveTab = useCallback(
    (tab: EntityViewTab) => {
      if (tab === EntityViewTab.Parameters && isChanged) {
        setNextTab(tab);
        onModalOpen(ModalType.entity);
      } else if (activeTab === EntityViewTab.Parameters && (isIframeChanged || isChanged)) {
        setNextTab(tab);
        onModalOpen(ModalType.parameters);
      } else {
        onSetActiveTab(tab);
      }
    },
    [activeTab, isChanged, isIframeChanged, onModalOpen, onSetActiveTab],
  );

  const onMessage = useCallback((event: MessageEvent<VisualizerConnectorRequest>) => {
    if (event.data?.type?.split('/')[1] !== VisualizerConnectorEvents.sendMessage) return;

    setIsIframeChanged((event.data as { payload: { isChanged: boolean } }).payload.isChanged);
  }, []);

  useEffect(() => {
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onMessage]);

  return {
    isModalOpen,
    modalType,
    onModalOpen,
    onModalClose,
    onModalCancel,
    onModalConfirm,
    onChangeActiveTab,
  };
};
