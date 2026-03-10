import { FC } from 'react';

import ListEntities from '@/src/components/ListView/List';
import { CONTAINER_EVENTS } from '@/src/constants/grid-columns/grid-columns';
import { EntitiesI18nKey, TabsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { KubEvent } from '@/src/models/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  route: ApplicationRoute;
  events: KubEvent[];
}

const Events: FC<Props> = ({ route, events }) => {
  const t = useI18n();

  return (
    <ListEntities
      rowData={events}
      columnDefs={CONTAINER_EVENTS(t)}
      listLabel={t(TabsI18nKey.Events)}
      emptyDataProps={{ title: t(EntitiesI18nKey.NoEvents) }}
      storageKey={`${route}/events`}
      isEnableColumnPanel
    />
  );
};

export default Events;
