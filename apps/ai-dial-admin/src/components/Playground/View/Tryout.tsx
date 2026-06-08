'use client';

import { FC, useEffect, useRef } from 'react';

import { ChatOverlay, Feature } from '@epam/ai-dial-overlay';

interface Props {
  chatDomain: string | undefined;
  modelId: string | undefined;
}

const PlaygroundTryout: FC<Props> = ({ chatDomain, modelId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatDomain || !containerRef.current) return;

    const overlay = new ChatOverlay(containerRef.current, {
      domain: chatDomain,
      hostDomain: window.location.origin,
      ...(modelId && { modelId }),
      enabledFeatures: [Feature.DisallowChangeAgent, Feature.HideEmptyChatChangeAgent],
    });

    return () => {
      overlay.destroy();
    };
  }, [chatDomain, modelId]);

  return (
    <div className="flex flex-col flex-1 bg-layer-3 rounded p-4">
      <div ref={containerRef} className="flex-1 min-h-0 mt-2" />
    </div>
  );
};

export default PlaygroundTryout;
