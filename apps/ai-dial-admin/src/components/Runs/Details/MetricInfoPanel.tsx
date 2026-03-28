'use client';

import { FC, useMemo } from 'react';

import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

import AdaptiveValueRow from './AdaptiveValueRow';
import { useFullscreenViewer } from './FullscreenViewer';

interface Props {
  infos: Record<string, unknown>;
  groupTitle: string;
}

interface MetricInfoGroup {
  metricKey: string;
  entries: Array<[string, string]>;
}

const MetricInfoPanel: FC<Props> = ({ infos, groupTitle }) => {
  const t = useI18n();
  const fullscreen = useFullscreenViewer();

  const groups = useMemo((): MetricInfoGroup[] => {
    return Object.entries(infos).map(([key, val]) => {
      if (val != null && typeof val === 'object' && !Array.isArray(val)) {
        const entries = Object.entries(val as Record<string, unknown>).map(
          ([subKey, subVal]) => [subKey, String(subVal)] as [string, string],
        );
        return { metricKey: key, entries };
      }
      return { metricKey: key, entries: [['value', String(val)] as [string, string]] };
    });
  }, [infos]);

  const allEntries = groups.flatMap((g) => g.entries);
  const hasLargeValue = allEntries.some(([, v]) => v.length > 200);

  const handleFullscreen = () => {
    const content = groups
      .map((g) => `--- ${g.metricKey} ---\n${g.entries.map(([k, v]) => `${k}: ${v}`).join('\n')}`)
      .join('\n\n');
    fullscreen.open(`${t(RunsI18nKey.MetricInfo)} \u2014 ${groupTitle}`, content, 'text');
  };

  return (
    <div className="mt-1.5 p-2 bg-layer-0 border border-secondary rounded text-[11px] max-h-[350px] overflow-auto">
      <div className="flex flex-col gap-3">
        {groups.map((group) => (
          <div key={group.metricKey}>
            <div className="text-[10px] font-semibold text-accent-secondary mb-1 uppercase tracking-wide">
              {group.metricKey}
            </div>
            <div className="flex flex-col">
              {group.entries.map(([key, value]) => (
                <AdaptiveValueRow key={`${group.metricKey}-${key}`} label={key} value={value} />
              ))}
            </div>
          </div>
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
