'use client';

import { FC, useEffect, useRef } from 'react';

import { ChatOverlay, Feature } from '@epam/ai-dial-overlay';
import { PlaygroundConfig } from './models';

interface Props {
  chatDomain: string | undefined;
  modelId: string | undefined;
  config: PlaygroundConfig | null;
}

const PlaygroundTryout: FC<Props> = ({ chatDomain, modelId, config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<ChatOverlay | null>(null);

  useEffect(() => {
    if (!chatDomain || !containerRef.current) return;

    const overlay = new ChatOverlay(containerRef.current, {
      domain: chatDomain,
      hostDomain: window.location.origin,
      ...(modelId && { modelId }),
      enabledFeatures: [Feature.DisallowChangeAgent, Feature.HideEmptyChatChangeAgent],
    });

    overlayRef.current = overlay;
    return () => {
      overlay.destroy();
      overlayRef.current = null;
    };
  }, [chatDomain, modelId]);

  useEffect(() => {
    if (!config || !overlayRef.current) return;

    if (config.temperature !== undefined) {
      overlayRef.current.setTemperature(config.temperature);
    }
    overlayRef.current.setSystemPrompt(config.systemPrompt);
  }, [config]);

  return (
    <div className="flex flex-col flex-1 bg-layer-3 rounded p-4">
      <div ref={containerRef} className="flex-1 min-h-0 mt-2" />
    </div>
  );
};

export default PlaygroundTryout;
