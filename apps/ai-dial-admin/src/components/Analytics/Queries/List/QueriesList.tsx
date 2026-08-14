'use client';

import { useCallback, useMemo, useState } from 'react';

import { DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { GridOptions } from 'ag-grid-community';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

import CreateQuery from '@/src/components/Analytics/Queries/Modals/CreateQuery';
import EditQuery from '@/src/components/Analytics/Queries/Modals/EditQuery';
import { onCellClicked } from '@/src/components/EntityListView/utils/on-cell-clicked';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import ListEntities from '@/src/components/ListView/List';
import { emptyDataTitleMap, listViewTitleMap } from '@/src/components/ListView/constants';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { QUERIES_COLUMN } from '@/src/constants/grid-columns/grid-columns';
import { getDeleteOperation, getEditOperation, getOpenInNewTabOperation } from '@/src/constants/grid-columns/actions';
import { ButtonsI18nKey, QueriesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntity } from '@/src/models/analytics/entity';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { deleteSavedQuery } from '@/src/app/[lang]/queries/actions';

interface Props {
  data: SavedQuery[];
  entities: AnalyticsEntity[];
}

const VIEW = ApplicationRoute.AnalyticsQueries;

const QueriesList = ({ data, entities }: Props) => {
  const t = useI18n();
  const router = useRouter();
  const { isFullAdmin } = useAppContext();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editedQuery, setEditedQuery] = useState<SavedQuery | undefined>(void 0);
  const [deletedQuery, setDeletedQuery] = useState<SavedQuery | undefined>(void 0);

  const isWritable = useCallback(
    (query?: SavedQuery) => query?.scope !== SavedQueryScope.Common || isFullAdmin,
    [isFullAdmin],
  );

  const onOpenNewTab = useCallback((query?: SavedQuery) => {
    if (query) onOpenInNewTab(VIEW, query);
  }, []);

  const onRemoveEntity = useCallback((id: string) => deleteSavedQuery(decodeURIComponent(id)), []);

  const columnDefs = useMemo(
    () => [
      ...QUERIES_COLUMN(t),
      ACTION_COLUMN<SavedQuery>(
        [
          getOpenInNewTabOperation(onOpenNewTab),
          getEditOperation(setEditedQuery, (_api, node) => !isWritable(node.data as SavedQuery)),
          getDeleteOperation(setDeletedQuery, (_api, node) => !isWritable(node.data as SavedQuery)),
        ],
        true,
      ),
    ],
    [t, onOpenNewTab, isWritable],
  );

  const gridOptions: GridOptions = useMemo(
    () => ({ onCellClicked: (e) => onCellClicked(e, VIEW, router.push) }),
    [router.push],
  );

  return (
    <>
      <ListEntities<SavedQuery>
        isMainListView
        isEnableColumnPanel
        listLabel={t(listViewTitleMap[VIEW])}
        rowData={data}
        columnDefs={columnDefs}
        additionalGridOptions={gridOptions}
        storageKey={VIEW}
        getHref={(query) => getUrnForEntity(VIEW, query)}
        getRowId={({ data: query }) => query.id}
        emptyDataProps={{ title: t(emptyDataTitleMap[VIEW]), description: t(QueriesI18nKey.NoQueriesDescription) }}
      >
        <DialPrimaryButton
          label={t(ButtonsI18nKey.Create)}
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
          onClick={() => setIsCreateOpen(true)}
        />
      </ListEntities>

      {isCreateOpen && <CreateQuery entities={entities} onClose={() => setIsCreateOpen(false)} />}

      {editedQuery && <EditQuery query={editedQuery} onClose={() => setEditedQuery(void 0)} />}

      {deletedQuery &&
        createPortal(
          <DeleteConfirmationModal<SavedQuery>
            view={VIEW}
            entity={deletedQuery}
            onRemoveEntity={onRemoveEntity}
            onCloseModal={() => setDeletedQuery(void 0)}
          />,
          document.body,
        )}
    </>
  );
};

export default QueriesList;
