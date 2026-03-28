'use client';

import { FC, useMemo } from 'react';

import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import { useFullscreenViewer } from './FullscreenViewer';
import AdaptiveValueRow from './AdaptiveValueRow';

interface Props {
  infos: Record<string, unknown>;
  groupTitle: string;
}

const MetricInfoPanel: FC<Props> = ({ infos, groupTitle }) => {
  const t = useI18n();
  const fullscreen = useFullscreenViewer();

  const entries = useMemo(() => {
    return Object.entries(infos).flatMap(([key, val]) => {
      if (val != null && typeof val === 'object' && !Array.isArray(val)) {
        return Object.entries(val as Record<string, unknown>).map(
          ([subKey, subVal]) => [subKey, String(subVal)] as [string, string],
        );
      }
      return [[key, String(val)] as [string, string]];
    });
  }, [infos]);

  const hasLargeValue = entries.some(([, v]) => v.length > 200);

  const handleFullscreen = () => {
    const content = entries.map(([k, v]) => `${k}: ${v}`).join('\n\n');
    fullscreen.open(`${t(RunsI18nKey.MetricInfo)} \u2014 ${groupTitle}`, content, 'text');
  };

  return (
    <div className="mt-1.5 p-2 bg-layer-0 border border-secondary rounded text-[11px]">
      <div className="flex flex-col">
        {entries.map(([key, value]) => (
          <AdaptiveValueRow key={key} label={key} value={value} />
        ))}
      </div>
      {hasLargeValue && (
        <button
          className="w-full mt-1.5 px-2 py-1 border border-secondary rounded text-[10px] text-secondary hover:text-primary hover:bg-layer-4 transition-colors"
          onClick={handleFullscreen}
        >
          {t(RunsI18nKey.OpenFullscreen)}
        </button>
      )}
    </div>
  );
};

export default MetricInfoPanel;
