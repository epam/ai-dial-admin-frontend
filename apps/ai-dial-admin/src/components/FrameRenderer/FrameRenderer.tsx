import { Spinner, NoDataContent } from '@epam/ai-dial-ui-kit';

import {
  VisualizerConnectorEvents,
  VisualizerConnectorRequest,
  VisualizerConnectorRequests,
} from '@epam/ai-dial-shared';
import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';
import classNames from 'classnames';
import { forwardRef, Ref, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { FrameMessageType } from '@/src/components/FrameRenderer/constants';
import { FrameCallbacks, FrameMessage, FrameRendererHandle } from '@/src/components/FrameRenderer/models';
import { getFrameOrigin, getSaveErrorMessage, isFrameMessageType } from '@/src/components/FrameRenderer/utils';
import { useAppContext } from '@/src/context/AppContext';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { DialAttachmentData } from '@/src/models/attachment-data';

interface Props extends FrameCallbacks {
  iframeUrl: string;
  name?: string;
  onMessage?: (event: MessageEvent) => void;
  containerClassName?: string;
  isJsonEditorEnabled?: boolean;
}

const FrameRenderer = forwardRef<FrameRendererHandle, Props>(
  (
    {
      iframeUrl,
      name,
      onMessage,
      containerClassName,
      isJsonEditorEnabled,
      onDirtyChange,
      onValidityChange,
      onSaveSuccess,
      onSaveError,
    },
    ref: Ref<FrameRendererHandle>,
  ) => {
    const { setVisualizerConnector } = useAppContext();

    const containerRef = useRef<HTMLDivElement>(null);
    const visualizerRef = useRef<VisualizerConnector>(null);

    const [loading, setLoading] = useState(true);
    const [isEmptyData, setIsEmptyData] = useState(false);

    const isDirtyRef = useRef(false);
    const isInvalidRef = useRef(false);
    const callbacksRef = useRef({ onDirtyChange, onValidityChange, onSaveSuccess, onSaveError });

    useEffect(() => {
      callbacksRef.current = { onDirtyChange, onValidityChange, onSaveSuccess, onSaveError };
    }, [onDirtyChange, onValidityChange, onSaveSuccess, onSaveError]);

    const className = classNames(containerClassName, 'relative size-full');

    const postToFrame = useCallback(
      (type: FrameMessageType) => {
        const origin = getFrameOrigin(iframeUrl);
        const frameWindow = containerRef.current?.querySelector('iframe')?.contentWindow;

        if (!origin || !frameWindow) return;

        frameWindow.postMessage({ type }, origin);
      },
      [iframeUrl],
    );

    useImperativeHandle(
      ref,
      () => ({
        triggerSave: () => postToFrame(FrameMessageType.TriggerSave),
        reset: () => postToFrame(FrameMessageType.Reset),
      }),
      [postToFrame],
    );

    const setDirty = useCallback((isDirty: boolean) => {
      isDirtyRef.current = isDirty;
      callbacksRef.current.onDirtyChange?.(isDirty);
    }, []);

    const setValid = useCallback((isValid: boolean) => {
      isInvalidRef.current = !isValid;
      callbacksRef.current.onValidityChange?.(isValid);
    }, []);

    const onFrameMessage = useCallback(
      (event: MessageEvent<FrameMessage>) => {
        const frameWindow = containerRef.current?.querySelector('iframe')?.contentWindow;

        if (!frameWindow || event.source !== frameWindow || event.origin !== getFrameOrigin(iframeUrl)) return;

        switch (event.data.type) {
          case FrameMessageType.DirtyState:
            setDirty(event.data.payload?.isDirty === true);
            break;
          case FrameMessageType.ValidityState:
            if (typeof event.data.payload?.isValid === 'boolean') setValid(event.data.payload.isValid);
            break;
          case FrameMessageType.SaveSuccess:
            callbacksRef.current.onSaveSuccess?.();
            break;
          case FrameMessageType.SaveError:
            callbacksRef.current.onSaveError?.(getSaveErrorMessage(event.data));
            break;
        }
      },
      [iframeUrl, setDirty, setValid],
    );

    const handleMessage = useCallback(
      (event: MessageEvent<VisualizerConnectorRequest | FrameMessage>) => {
        if (isFrameMessageType(event.data?.type)) {
          onFrameMessage(event as MessageEvent<FrameMessage>);
          return;
        }

        if ((event.data as VisualizerConnectorRequest)?.type?.split('/')[0] !== name) return;

        if (onMessage) {
          onMessage(event as MessageEvent);
        }

        if (event.data.type === `${name}/${VisualizerConnectorEvents.readyToInteract}`) {
          setLoading(false);
          setIsEmptyData(false);
        }
      },
      [onFrameMessage, onMessage, name],
    );

    const sendMessage = useCallback(async (visualizer: VisualizerConnector, isJsonEditorEnabled?: boolean) => {
      const messagePayload: DialAttachmentData = {
        mimeType: APPLICATION_JSON_TYPE,
        visualizerData: {
          layout: { width: 0, height: 0 },
          jsonEditorEnabled: isJsonEditorEnabled,
        },
      };
      await visualizer.ready();

      visualizer.send(VisualizerConnectorRequests.sendVisualizeData, messagePayload);
    }, []);

    useEffect(() => {
      if (containerRef.current && !visualizerRef.current) {
        visualizerRef.current = new VisualizerConnector(containerRef.current, {
          domain: iframeUrl,
          hostDomain: window.location.origin,
          visualizerName: name || '',
        });

        // The connector's sandbox lacks this token, so auth popups inherit it and get blocked.
        containerRef.current.querySelector('iframe')?.sandbox.add('allow-popups-to-escape-sandbox');

        setVisualizerConnector?.(visualizerRef.current);

        return () => {
          visualizerRef.current?.destroy();
          visualizerRef.current = null;
        };
      }
    }, [iframeUrl, name, setVisualizerConnector]);

    useEffect(() => {
      if (!!visualizerRef.current && containerRef.current) {
        sendMessage(visualizerRef.current, isJsonEditorEnabled);
        const timeoutId = setTimeout(() => {
          if (loading) {
            setLoading(false);
            setIsEmptyData(true);
          }
        }, 10000);

        return () => clearTimeout(timeoutId);
      }
    }, [sendMessage, isJsonEditorEnabled, loading]);

    useEffect(() => {
      return () => {
        if (isDirtyRef.current) setDirty(false);
        if (isInvalidRef.current) setValid(true);
      };
    }, [iframeUrl, setDirty, setValid]);

    useEffect(() => {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    return (
      <div className="relative size-full">
        {loading && (
          <div className="absolute inset-0 z-50 bg-layer-2">
            <Spinner size={40} fullWidth />
          </div>
        )}
        {isEmptyData ? (
          <NoDataContent title="Error loading application custom UI" />
        ) : (
          <div ref={containerRef} className={className} />
        )}
      </div>
    );
  },
);

FrameRenderer.displayName = 'FrameRenderer';

export default FrameRenderer;
