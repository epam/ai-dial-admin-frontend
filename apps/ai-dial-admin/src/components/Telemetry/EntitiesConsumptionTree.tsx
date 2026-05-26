'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useState } from 'react';

import TreeGrid from '@/src/components/Common/TreeGrid/TreeGrid';
import { TreeRow } from '@/src/components/Common/TreeGrid/types';
import { BasicI18nKey } from '@/src/constants/i18n';
import { refreshOptionsConfig } from '@/src/constants/telemetry/filters';
import { TELEMETRY_GRID_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ENTITY_CONSUMPTION_TREE_QUERY } from '@/src/constants/telemetry';
import { useI18n } from '@/src/locales/client';
import { EntityRow, TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { ServerActionResponse } from '@/src/models/server-action';
import { buildEntitiesConsumptionTree } from '@/src/utils/entities-consumption-tree';
import { getGridData } from '@/src/utils/telemetry';

interface Props {
  title: string;
  getData: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  refreshTime?: string;
}

const EntitiesConsumptionTree: FC<Props> = ({ title, getData, refreshTime }) => {
  const t = useI18n();
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<TreeRow<EntityRow>[] | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      const response = await getData(ENTITY_CONSUMPTION_TREE_QUERY);
      if (response?.success) {
        const rows = getGridData(response.response as TelemetryData) as EntityRow[];
        setTreeData(buildEntitiesConsumptionTree(rows));
      } else {
        setTreeData(null);
      }
      setLoading(false);
    };

    fetch();

    const timeout = refreshOptionsConfig.find((item) => item?.value === refreshTime)?.timeout;
    if (!timeout) return;

    const intervalId = setInterval(() => {
      fetch();
    }, timeout);

    return () => clearInterval(intervalId);
  }, [getData, refreshTime]);

  return (
    <div className="flex flex-col size-full rounded-lg border border-primary p-4 max-h-[580px]">
      <div className="mb-4 flex flex-row items-center justify-between">
        <h3>{title}</h3>
      </div>
      {loading ? (
        <DialLoader size={24} />
      ) : (
        <div className="flex-1 min-h-0">
          <TreeGrid<EntityRow>
            rows={treeData ?? []}
            columnDefs={TELEMETRY_GRID_COLUMNS}
            expanderColumnField="name"
            emptyDataTitle={t(BasicI18nKey.NoData)}
          />
        </div>
      )}
    </div>
  );
};

export default EntitiesConsumptionTree;
