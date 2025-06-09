'use client';
import { FC } from 'react';

import Grafana from '@/public/images/icons/grafana.svg';
import { MenuI18nKey, TelemetryI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import Dashboard from '@/src/components/Telemetry/Dashboard';
import { ApplicationRoute } from '@/src/types/routes';
import Link from 'next/link';

interface Props {
  grafanaLink?: string;
}

const DashboardView: FC<Props> = ({ grafanaLink }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 relative" data-testid={'dashboard-view'}>
      <div className="flex flex-row mb-3 py-1.5 justify-between">
        <h1 className="truncate" data-testid="dashboard-view-heading">
          {t(MenuI18nKey.Dashboard)}
        </h1>
        {grafanaLink && (
          <Link className="tertiary" href={grafanaLink} target={'_blank'}>
            <Grafana />
            <p className="small-text-semi ml-2">{t(TelemetryI18nKey.Grafana)}</p>
          </Link>
        )}
      </div>
      <Dashboard route={ApplicationRoute.Dashboard} />
    </div>
  );
};

export default DashboardView;
