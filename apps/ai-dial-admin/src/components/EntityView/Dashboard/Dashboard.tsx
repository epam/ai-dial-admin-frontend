import { FC } from 'react';
import { DialBaseEntity } from '@/src/models/dial/base-entity';

import { ApplicationRoute } from '@/src/types/routes';
import Dashboard from '@/src/components/Telemetry/Dashboard';

interface Props {
  entity: DialBaseEntity;
  view: ApplicationRoute;
}

const EntityDashboard: FC<Props> = ({ entity, view }) => {
  return (
    <div
      className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 relative"
      data-testid={'entity-dashboard'}
    >
      <Dashboard entity={entity} route={view} />
    </div>
  );
};

export default EntityDashboard;
