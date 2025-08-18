import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { FC } from 'react';

import ActivityAuditList from '@/src/components/ActivityAudit/List/List';
import { EntityViewTab } from '@/src/components/EntityView/View/utils';
import Dashboard from '@/src/components/Telemetry/Dashboard';
import { TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  entity: DialBaseEntity;
  view: ApplicationRoute;
}

const EntityRoutes: FC<Props> = ({ entity, view }) => {
  const t = useI18n() as (str: string) => string;

  return (
    <div className="flex flex-row gap-4 h-full w-full">
      <div className="bg-layer-3 h-full w-[296px] p-4">
        <div className="flex flex-row flex-wrap justify-between">
          <h1 className="mb-4">{t(TabsI18nKey.Roles)}</h1>
        </div>
      </div>
      <div className="flex flex-col flex-1 min-h-0 w-full relative"></div>
    </div>
  );
};

export default EntityRoutes;
