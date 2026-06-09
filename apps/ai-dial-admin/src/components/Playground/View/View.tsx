'use client';

import { FC, useCallback, useState } from 'react';

import { PlaygroundI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import PlaygroundDetails from './Details';
import { PlaygroundConfig } from './models';
import PlaygroundTryout from './Tryout';

const INITIAL_CONFIG: PlaygroundConfig = {
  deployment: undefined,
  temperature: undefined,
  systemPrompt: '',
};

interface Props {
  chatDomain: string | undefined;
}

const PlaygroundView: FC<Props> = ({ chatDomain }) => {
  const t = useI18n();
  const [config, setConfig] = useState<PlaygroundConfig>(INITIAL_CONFIG);
  const [appliedSettings, setAppliedSettings] = useState<PlaygroundConfig | null>(null);

  const onApply = useCallback(() => {
    setAppliedSettings({ ...config });
  }, [config]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 gap-4">
      <h1>{t(PlaygroundI18nKey.Title)}</h1>
      <div className="flex flex-row flex-1 min-h-0 gap-4">
        <PlaygroundDetails config={config} onConfigChange={setConfig} onApply={onApply} />
        <PlaygroundTryout chatDomain={chatDomain} modelId={config.deployment?.deploymentId} config={appliedSettings} />
      </div>
    </div>
  );
};

export default PlaygroundView;
