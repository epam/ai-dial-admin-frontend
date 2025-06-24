import Loader from '@/src/components/Common/Loader/Loader';
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
  containerCss?: string;
  jsonEditorEnabled?: boolean;
}

const FrameRenderer = forwardRef<HTMLDivElement, Props>(
  ({ iframeUrl, name, onMessage, containerCss, jsonEditorEnabled }, ref: Ref<HTMLDivElement>) => {
    const { setVisualizerConnector } = useAppContext();
    const containerRef = useRef<HTMLDivElement>(null);
    const visualizerRef = useRef<VisualizerConnector>(null);

    const [loading, setLoading] = useState<boolean>(true);

    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

    const containerClassNames = classNames(containerCss, 'relative h-full w-full');

    const handleMessage = useCallback(
      (event: MessageEvent<VisualizerConnectorRequest>) => {
        if (event.data?.type?.split('/')[0] !== name) return;

        if (onMessage) {
          onMessage(event);
        }

        if (event.data.type === `${name}/${VisualizerConnectorEvents.readyToInteract}`) {
          setLoading(false);
        }
      },
      [onMessage, name],
    );

    const sendMessage = useCallback(async (visualizer: VisualizerConnector, jsonEditorEnabled?: boolean) => {
      const messagePayload: DialAttachmentData = {
        mimeType: APPLICATION_JSON_TYPE,
        visualizerData: {
          layout: { width: 0, height: 0 },
          jsonEditorEnabled,
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

        (visualizerRef.current as unknown as { iframe: HTMLIFrameElement }).iframe.sandbox.add('clipboard-write');
        setVisualizerConnector?.(visualizerRef.current);

        return () => {
          visualizerRef.current?.destroy();
          visualizerRef.current = null;
        };
      }
    }, [iframeUrl, name, setVisualizerConnector]);

    useEffect(() => {
      if (!!visualizerRef.current && containerRef.current) {
        sendMessage(visualizerRef.current, jsonEditorEnabled);
      }
    }, [loading, sendMessage, jsonEditorEnabled]);

    useEffect(() => {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    return (
      <div className={'relative h-full w-full'}>
        {loading && (
          <div className="absolute inset-0 z-50 bg-layer-2">
            <Loader size={40} />
          </div>
        )}
        <div ref={containerRef} className={containerClassNames} />
      </div>
    );
  },
);

FrameRenderer.displayName = 'FrameRenderer';

export default FrameRenderer;
