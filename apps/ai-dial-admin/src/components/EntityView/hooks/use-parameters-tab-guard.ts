'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  VisualizerConnectorEvents,
  VisualizerConnectorRequest,
  VisualizerConnectorRequests,
} from '@epam/ai-dial-shared';
import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';

import { ModalType } from '@/src/components/EntityView/Modals/constants';
import { PENDING_SAVE_TIMEOUT_MS } from '@/src/components/FrameRenderer/constants';
import { FrameRendererHandle } from '@/src/components/FrameRenderer/models';
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
  onIframeSaveSuccess?: () => void;
  onIframeSaveError?: (message?: string) => void;
}

export const useParametersTabGuard = ({
  activeTab,
  isChanged,
  visualizerConnector,
  onSaveEntity,
  onDiscardEntity,
  onSetActiveTab,
  onIframeSaveSuccess,
  onIframeSaveError,
}: Props) => {
  const [nextTab, setNextTab] = useState<EntityViewTab>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>();
  const [isIframeChanged, setIsIframeChanged] = useState(false);
  const [isIframeDirty, setIsIframeDirty] = useState(false);
  const [isIframeValid, setIsIframeValid] = useState(true);
  const [isIframeSaving, setIsIframeSaving] = useState(false);

  const frameRef = useRef<FrameRendererHandle>(null);
  const isIframeSavingRef = useRef(false);
  const isSwitchAfterSaveRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  const onFinishIframeSave = useCallback(() => {
    clearTimeout(saveTimeoutRef.current);
    isIframeSavingRef.current = false;
    setIsIframeSaving(false);
  }, []);

  const onIframeSaveFailed = useCallback(
    (message?: string) => {
      if (!isIframeSavingRef.current) return;

      onFinishIframeSave();
      isSwitchAfterSaveRef.current = false;
      onIframeSaveError?.(message);
    },
    [onFinishIframeSave, onIframeSaveError],
  );

  const onSaveIframe = useCallback(() => {
    if (!isIframeValid) return;

    isIframeSavingRef.current = true;
    setIsIframeSaving(true);
    frameRef.current?.triggerSave();
    saveTimeoutRef.current = setTimeout(() => onIframeSaveFailed(), PENDING_SAVE_TIMEOUT_MS);
  }, [isIframeValid, onIframeSaveFailed]);

  const onDiscardIframe = useCallback(() => {
    frameRef.current?.reset();
  }, []);

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

  const onIframeSaved = useCallback(() => {
    if (!isIframeSavingRef.current) return;

    onFinishIframeSave();
    setIsIframeDirty(false);
    onIframeSaveSuccess?.();

    if (isSwitchAfterSaveRef.current) {
      isSwitchAfterSaveRef.current = false;
      onChangeTab();
    }
  }, [onChangeTab, onFinishIframeSave, onIframeSaveSuccess]);

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
      if (type === ModalType.parameters && isIframeDirty) {
        onModalClose();
        if (isIframeValid) {
          isSwitchAfterSaveRef.current = true;
          onSaveIframe();
        } else {
          onIframeSaveError?.();
        }
      } else if (type === ModalType.parameters) {
        onSendSaveParametersMessage();
        onModalClose();
        // wait for iframe save before switching tabs
        setTimeout(() => {
          onChangeTab();
        }, 2000);
      }
    },
    [
      isIframeDirty,
      isIframeValid,
      onChangeTab,
      onIframeSaveError,
      onModalClose,
      onSaveEntity,
      onSaveIframe,
      onSendSaveParametersMessage,
    ],
  );

  const onChangeActiveTab = useCallback(
    (tab: EntityViewTab) => {
      if (tab === EntityViewTab.Parameters && isChanged) {
        setNextTab(tab);
        onModalOpen(ModalType.entity);
      } else if (activeTab === EntityViewTab.Parameters && (isIframeChanged || isIframeDirty || isChanged)) {
        setNextTab(tab);
        onModalOpen(ModalType.parameters);
      } else {
        onSetActiveTab(tab);
      }
    },
    [activeTab, isChanged, isIframeChanged, isIframeDirty, onModalOpen, onSetActiveTab],
  );

  const onMessage = useCallback((event: MessageEvent<VisualizerConnectorRequest>) => {
    if (event.data?.type?.split('/')[1] !== VisualizerConnectorEvents.sendMessage) return;

    setIsIframeChanged((event.data as { payload: { isChanged: boolean } }).payload.isChanged);
  }, []);

  useEffect(() => {
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onMessage]);

  useEffect(() => () => clearTimeout(saveTimeoutRef.current), []);

  return {
    frameRef,
    isIframeDirty,
    isIframeSaving,
    isIframeValid,
    onFrameDirtyChange: setIsIframeDirty,
    onFrameValidityChange: setIsIframeValid,
    onFrameSaveSuccess: onIframeSaved,
    onFrameSaveError: onIframeSaveFailed,
    onSaveIframe,
    onDiscardIframe,
    isModalOpen,
    modalType,
    onModalOpen,
    onModalClose,
    onModalCancel,
    onModalConfirm,
    onChangeActiveTab,
  };
};
