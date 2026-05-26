'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useMemo, useRef, useState } from 'react';

import TreeGrid from '@/src/components/Common/TreeGrid/TreeGrid';
import { TreeRow } from '@/src/components/Common/TreeGrid/types';
import { BasicI18nKey } from '@/src/constants/i18n';
import { refreshOptionsConfig } from '@/src/constants/telemetry/filters';
import { TELEMETRY_GRID_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ENTITY_CONSUMPTION_TREE_QUERY } from '@/src/constants/telemetry';
import { useI18n } from '@/src/locales/client';
import { EntityRow, TelemetryData, TelemetryQuery } from '@/src/models/telemetry';
import { ServerActionResponse } from '@/src/models/server-action';
import { aggregateByDeployment } from '@/src/utils/consumption-aggregation';
import { buildEntitiesConsumptionTree } from '@/src/utils/entities-consumption-tree';

interface Props {
  title: string;
  getData?: (query: TelemetryQuery) => Promise<ServerActionResponse>;
  refreshTime?: string;
  rows?: EntityRow[] | null;
  loading?: boolean;
}

const EntitiesConsumptionTree: FC<Props> = ({ title, getData, refreshTime, rows, loading: loadingProp }) => {
  const t = useI18n();
  const controlled = rows !== undefined;
  const [internalLoading, setInternalLoading] = useState(!controlled);
  const [internalTreeData, setInternalTreeData] = useState<TreeRow<EntityRow>[] | null>(null);

  // Keep getData in a ref so the fetch effect doesn't re-run (and re-fetch)
  // every time an ancestor passes a fresh function reference.
  const getDataRef = useRef(getData);
  useEffect(() => {
    getDataRef.current = getData;
  });

  useEffect(() => {
    if (controlled) return;

    setInternalLoading(true);
    const fetch = async () => {
      const fn = getDataRef.current;
      if (!fn) {
        setInternalLoading(false);
        return;
      }
      try {
        const response = await fn(ENTITY_CONSUMPTION_TREE_QUERY);
        if (response?.success) {
          const fetched = aggregateByDeployment(response.response as TelemetryData);
          setInternalTreeData(buildEntitiesConsumptionTree(fetched));
        } else {
          setInternalTreeData(null);
        }
      } catch {
        setInternalTreeData(null);
      } finally {
        setInternalLoading(false);
      }
    };

    fetch();

    const timeout = refreshOptionsConfig.find((item) => item?.value === refreshTime)?.timeout;
    if (!timeout) return;

    const intervalId = setInterval(() => {
      fetch();
    }, timeout);

    return () => clearInterval(intervalId);
  }, [controlled, refreshTime]);

  const controlledTreeData = useMemo(
    () => (controlled && rows ? buildEntitiesConsumptionTree(rows) : null),
    [controlled, rows],
  );

  const loading = controlled ? !!loadingProp : internalLoading;
  const treeData = controlled ? controlledTreeData : internalTreeData;

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
