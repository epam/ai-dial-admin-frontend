'use client';
import { useCallback, useMemo } from 'react';

import { withNameLink } from '@/src/components/Grid/columns/name-link-column';
import { emptyDataTitleMap, listViewTitleMap } from '@/src/components/ListView/constants';
import ListEntities from '@/src/components/ListView/List';
import { getPublicationColumns } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';

const ROUTE = ApplicationRoute.Publications;

interface Props<T> {
  data: T[];
}

const PublicationsList = <T extends Publication>({ data }: Props<T>) => {
  const t = useI18n();

  const openInNewTab = useCallback((publication?: Publication) => {
    onOpenInNewTab(ROUTE, publication);
  }, []);

  const getPublicationHref = useCallback((row?: unknown) => getUrnForEntity(ROUTE, row), []);

  const gridColumns = useMemo(
    () => withNameLink(getPublicationColumns(openInNewTab, t), getPublicationHref, 'requestName'),
    [openInNewTab, t, getPublicationHref],
  );

  return (
    <ListEntities
      rowData={data}
      columnDefs={gridColumns}
      listLabel={t(listViewTitleMap[ROUTE])}
      emptyDataProps={{ title: t(emptyDataTitleMap[ROUTE]) }}
      getHref={getPublicationHref}
      storageKey={ApplicationRoute.Publications}
    />
  );
};

export default PublicationsList;
