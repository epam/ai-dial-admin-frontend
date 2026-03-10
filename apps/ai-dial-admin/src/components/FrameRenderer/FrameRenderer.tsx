import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import {
  VisualizerConnectorEvents,
  VisualizerConnectorRequest,
  VisualizerConnectorRequests,
} from '@epam/ai-dial-shared';
import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';
import classNames from 'classnames';
import { forwardRef, Ref, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useAppContext } from '@/src/context/AppContext';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { DialAttachmentData } from '@/src/models/attachment-data';

interface Props {
  iframeUrl: string;
  name?: string;
  onMessage?: (event: MessageEvent) => void;
  containerClassName?: string;
  isJsonEditorEnabled?: boolean;
}

const FrameRenderer = forwardRef<HTMLDivElement, Props>(
  ({ iframeUrl, name, onMessage, containerClassName, isJsonEditorEnabled }, ref: Ref<HTMLDivElement>) => {
    const { setVisualizerConnector } = useAppContext();

    const containerRef = useRef<HTMLDivElement>(null);
    const visualizerRef = useRef<VisualizerConnector>(null);

    const [loading, setLoading] = useState(true);
    const [isEmptyData, setIsEmptyData] = useState(false);

    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    const className = classNames(containerClassName, 'relative size-full');

    const handleMessage = useCallback(
      (event: MessageEvent<VisualizerConnectorRequest>) => {
        if (event.data?.type?.split('/')[0] !== name) return;

        if (onMessage) {
          onMessage(event);
        }

        if (event.data.type === `${name}/${VisualizerConnectorEvents.readyToInteract}`) {
          setLoading(false);
          setIsEmptyData(false);
        }
      },
      [onMessage, name],
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
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    return (
      <div className="relative size-full">
        {loading && (
          <div className="absolute inset-0 z-50 bg-layer-2">
            <DialLoader size={40} />
          </div>
        )}
        {isEmptyData ? (
          <DialNoDataContent title="Error loading application custom UI" />
        ) : (
          <div ref={containerRef} className={className} />
        )}
      </div>
    );
  },
);

FrameRenderer.displayName = 'FrameRenderer';

export default FrameRenderer;
