import { Dispatch, FC, SetStateAction, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  VisualizerConnectorEvents,
  VisualizerConnectorRequest,
  VisualizerConnectorRequests,
} from '@epam/ai-dial-shared';
import { DialConfirmationPopup, DialSelect, SelectOption, SelectSize, SelectVariant } from '@epam/ai-dial-ui-kit';
import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';

import { ButtonsI18nKey, CompareI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { DialAttachmentData } from '@/src/models/attachment-data';
import { ParamsView } from '@/src/types/parameters';

interface Props {
  items: SelectOption[];
  paramsView: ParamsView;
  setParamsView: Dispatch<SetStateAction<ParamsView>>;
  onSave?: () => void;
  isChanged?: boolean;
}

const ViewControl: FC<Props> = ({ items, paramsView, setParamsView, onSave, isChanged }) => {
  const t = useI18n();
  const { visualizerConnector } = useAppContext();

  const [nextView, setNextView] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isIframeChanged, setIsIframeChanged] = useState<boolean>(false);

  const sendMessage = useCallback(async (visualizer?: VisualizerConnector | null) => {
    const messagePayload: DialAttachmentData = {
      mimeType: APPLICATION_JSON_TYPE,
      visualizerData: {
        saveChanges: true,
        layout: { width: 0, height: 0 },
      },
    };
    visualizer?.send(VisualizerConnectorRequests.sendVisualizeData, messagePayload);
  }, []);

  const handleMessage = useCallback(
    (event: MessageEvent<VisualizerConnectorRequest>) => {
      if (event.data?.type?.split('/')[1] !== VisualizerConnectorEvents.sendMessage) return;
      setIsIframeChanged((event.data as { payload: { isChanged: boolean } }).payload.isChanged);
    },
    [setIsIframeChanged],
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleMessage]);

  const onChange = useCallback(
    (value: string) => {
      if (isChanged || isIframeChanged) {
        setNextView(value);
        setIsModalOpen(true);
      } else {
        setParamsView(value as ParamsView);
      }
    },
    [isChanged, isIframeChanged, setParamsView],
  );

  const onCancel = useCallback(() => {
    if (nextView) {
      setParamsView(nextView as ParamsView);
    }
    setNextView(null);
    setIsModalOpen(false);
  }, [nextView, setParamsView]);

  const onConfirm = useCallback(() => {
    if (paramsView === ParamsView.UI) {
      sendMessage(visualizerConnector);
      // need to wait saving until change tab
      setTimeout(() => {
        setParamsView(nextView as ParamsView);
        onCancel();
      }, 2000);
    } else {
      onSave?.();
      setIsModalOpen(false);
    }
  }, [nextView, onCancel, onSave, paramsView, sendMessage, setParamsView, visualizerConnector]);

  return (
    <>
      <DialSelect
        prefix={`${t(CompareI18nKey.View)}: `}
        size={SelectSize.Sm}
        variant={SelectVariant.Secondary}
        options={items}
        value={paramsView}
        onChange={(v) => onChange(v as string)}
      />
      {createPortal(
        <DialConfirmationPopup
          open={isModalOpen}
          header={t(EntitiesI18nKey.SaveParametersTitle)}
          description={t(EntitiesI18nKey.SaveParametersDescription)}
          confirmLabel={t(ButtonsI18nKey.Save)}
          cancelLabel={t(ButtonsI18nKey.LeaveWithoutSave)}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onClose={() => setIsModalOpen(false)}
        />,
        document.body,
      )}
    </>
  );
};

export default ViewControl;
