'use client';

import { FC, useCallback } from 'react';

import { DialNumberInput, DialPrimaryButton, DialTextarea } from '@epam/ai-dial-ui-kit';

import { PlaygroundI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Deployment } from '@/src/models/evaluation/deployment';
import PlaygroundDeploymentSelector from './DeploymentSelector';
import { PlaygroundConfig } from './models';

interface Props {
  config: PlaygroundConfig;
  onConfigChange: (config: PlaygroundConfig) => void;
  onApply: () => void;
}

const PlaygroundDetails: FC<Props> = ({ config, onConfigChange, onApply }) => {
  const t = useI18n();

  const onSelectDeployment = useCallback(
    (deployment: Deployment) => onConfigChange({ ...config, deployment }),
    [config, onConfigChange],
  );

  const onTemperatureChange = useCallback(
    (value: number | string | undefined) => {
      const num = value === undefined ? undefined : typeof value === 'string' ? parseFloat(value) : value;
      onConfigChange({ ...config, temperature: num === undefined || isNaN(num) ? undefined : num });
    },
    [config, onConfigChange],
  );

  const onSystemPromptChange = useCallback(
    (systemPrompt: string) => onConfigChange({ ...config, systemPrompt }),
    [config, onConfigChange],
  );

  return (
    <div className="flex flex-col w-[450px] shrink-0 bg-layer-3 rounded p-4 gap-4">
      <PlaygroundDeploymentSelector
        selectedDeploymentId={config.deployment?.deploymentId}
        onSelect={onSelectDeployment}
      />

      <div className="border-t border-secondary" />

      <DialNumberInput
        id="temperature"
        labelProps={{ label: t(PlaygroundI18nKey.Temperature) }}
        value={config.temperature}
        onChange={onTemperatureChange}
        min={0}
        max={1}
        placeholder="0 – 1"
      />

      <div className="flex flex-col flex-1 min-h-0">
        <DialTextarea
          id="system-prompt"
          labelProps={{ label: t(PlaygroundI18nKey.SystemPrompt) }}
          placeholder={t(PlaygroundI18nKey.SystemPromptPlaceholder)}
          value={config.systemPrompt}
          onChange={onSystemPromptChange}
          containerClassName="h-full"
          className="resize-y"
        />
      </div>

      <DialPrimaryButton label={t(PlaygroundI18nKey.ApplySettings)} onClick={onApply} />
    </div>
  );
};

export default PlaygroundDetails;
