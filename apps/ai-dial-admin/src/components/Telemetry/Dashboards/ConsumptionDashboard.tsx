'use client';

import { FC, useEffect, useState } from 'react';

import EntitiesConsumptionTree from '@/src/components/Telemetry/EntitiesConsumptionTree';
import TelemetryGrid from '@/src/components/Telemetry/TelemetryGrid';
import { PROJECT_GRID_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { TelemetryI18nKey } from '@/src/constants/i18n';
import { ENTITY_CONSUMPTION_TREE_QUERY } from '@/src/constants/telemetry';
import { refreshOptionsConfig } from '@/src/constants/telemetry/filters';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { EntityRow, TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { ApplicationRoute } from '@/src/types/routes';
import { aggregateByDeployment, aggregateByProject } from '@/src/utils/consumption-aggregation';

interface Props {
  route: ApplicationRoute;
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  refreshTime?: string;
}

const ConsumptionDashboard: FC<Props> = ({ route, getData, refreshTime }) => {
  const t = useI18n();
  const [loading, setLoading] = useState(true);
  const [deploymentRows, setDeploymentRows] = useState<EntityRow[] | null>(null);
  const [projectRows, setProjectRows] = useState<Record<string, string>[] | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      try {
        const response = await getData(ENTITY_CONSUMPTION_TREE_QUERY);
        if (response?.success) {
          const raw = response.response as TelemetryData;
          setDeploymentRows(aggregateByDeployment(raw));
          setProjectRows(aggregateByProject(raw));
        } else {
          setDeploymentRows(null);
          setProjectRows(null);
        }
      } catch {
        setDeploymentRows(null);
        setProjectRows(null);
      } finally {
        setLoading(false);
      }
    };

    fetch();

    const timeout = refreshOptionsConfig.find((item) => item?.value === refreshTime)?.timeout;
    if (!timeout) return;

    const intervalId = setInterval(() => {
      fetch();
    }, timeout);

    return () => clearInterval(intervalId);
  }, [refreshTime, getData]);

  return (
    <div className="flex flex-col w-full">
      {route === ApplicationRoute.Dashboard && (
        <div className="flex mb-6 w-full relative">
          <EntitiesConsumptionTree
            title={t(TelemetryI18nKey.EntitiesConsumption)}
            rows={deploymentRows}
            loading={loading}
          />
        </div>
      )}
      <div className="flex size-full relative">
        <TelemetryGrid
          title={t(TelemetryI18nKey.ProjectsConsumption)}
          columnDefs={PROJECT_GRID_COLUMNS}
          data={projectRows}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ConsumptionDashboard;
