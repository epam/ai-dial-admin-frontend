import { FC, useMemo } from 'react';

import { AnalyticsTable } from '@/src/models/analytics/table';
import { BaseEntity } from '@/src/models/dial/base-entity';

import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import { ActivityAuditView } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  table: AnalyticsTable;
}

const TableAudit: FC<Props> = ({ table }) => {
  // Memoized because `ActivityAuditList` keys its AG Grid datasource on the `entity` reference: a
  // fresh object per render re-sets the datasource and re-requests the first row block.
  const entity: BaseEntity = useMemo(
    () => ({ name: table.name, description: table.description }),
    [table.name, table.description],
  );

  return <EntityAudit entity={entity} view={ApplicationRoute.AnalyticsTables} viewMode={ActivityAuditView.Analytics} />;
};

export default TableAudit;
