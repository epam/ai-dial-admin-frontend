'use client';
import { FC, useCallback } from 'react';

import Grafana from '@/public/images/icons/grafana.svg';
import { MenuI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import Dashboard from '@/src/components/Telemetry/Dashboard';
import { ApplicationRoute } from '@/src/types/routes';
import { DialLinkButton } from '@epam/ai-dial-ui-kit';

interface Props {
  grafanaLink?: string;
}

const DashboardView: FC<Props> = ({ grafanaLink }) => {
  const t = useI18n();

  const onOpenGrafana = useCallback(() => {
    window.open(grafanaLink, '_blank');
  }, [grafanaLink]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 relative">
      <div className="flex flex-row mb-8 justify-between items-center h-[40px]">
        <h1>{t(MenuI18nKey.Dashboard)}</h1>
        {grafanaLink && (
          <DialLinkButton iconBefore={<Grafana />} label={t(TelemetryI18nKey.Grafana)} onClick={onOpenGrafana} />
        )}
      </div>
      <Dashboard route={ApplicationRoute.Dashboard} />
    </div>
  );
};

export default DashboardView;
