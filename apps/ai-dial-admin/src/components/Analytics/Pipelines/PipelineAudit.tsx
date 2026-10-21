import { FC, useMemo } from 'react';

import { Pipeline } from '@/src/models/analytics/pipeline';
import { BaseEntity } from '@/src/models/dial/base-entity';

import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import { ActivityAuditView } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  pipeline: Pipeline;
}

const PipelineAudit: FC<Props> = ({ pipeline }) => {
  // Memoized because `ActivityAuditList` keys its AG Grid datasource on the `entity` reference: a
  // fresh object per render re-sets the datasource and re-requests the first row block.
  const entity: BaseEntity = useMemo(() => ({ name: pipeline.name }), [pipeline.name]);

  return (
    <EntityAudit entity={entity} view={ApplicationRoute.AnalyticsPipelines} viewMode={ActivityAuditView.Analytics} />
  );
};

export default PipelineAudit;
