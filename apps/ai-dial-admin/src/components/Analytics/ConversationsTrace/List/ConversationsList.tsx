'use client';

import { CellClickedEvent, CellKeyDownEvent, GridReadyEvent, IDatasource } from 'ag-grid-community';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useMemo } from 'react';

import { conversationDetailHref } from '@/src/components/Analytics/ConversationsTrace/utils';
import { navigateEntityUrl } from '@/src/components/EntityListView/utils/on-cell-clicked';
import GridView from '@/src/components/Grid/GridView/GridView';
import { infiniteGridOptions } from '@/src/constants/ag-grid';
import {
  CONVERSATIONS_GROUP_HEADER_HEIGHT,
  CONVERSATIONS_HEADER_HEIGHT,
  CONVERSATIONS_ROW_HEIGHT,
  CONVERSATIONS_STORAGE_KEY,
} from '@/src/constants/analytics/conversations-trace';
import { CONVERSATIONS_TRACE_COLUMN_GROUPS } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';

interface Props {
  datasource: IDatasource;
  onGridReady: (event: GridReadyEvent) => void;
  schemaFields?: AnalyticsEntityField[] | null;
  isColumnsPanelOpen: boolean;
  onToggleColumnsPanel: () => void;
}

const ConversationsList: FC<Props> = ({
  datasource,
  onGridReady,
  schemaFields,
  isColumnsPanelOpen,
  onToggleColumnsPanel,
}) => {
  const t = useI18n();
  const router = useRouter();

  const columnDefs = useMemo(() => CONVERSATIONS_TRACE_COLUMN_GROUPS(t, schemaFields ?? []), [t, schemaFields]);

  const onOpenConversation = useCallback(
    (chatId: string, event?: MouseEvent | null) =>
      navigateEntityUrl(conversationDetailHref(chatId), router.push, event),
    [router],
  );

  const onCellClicked = useCallback(
    (e: CellClickedEvent<ConversationRow>) => {
      if (!e.data) return;
      onOpenConversation(e.data.chat_id, e.event as MouseEvent | undefined);
    },
    [onOpenConversation],
  );

  const onCellKeyDown = useCallback(
    (e: CellKeyDownEvent<ConversationRow>) => {
      if ((e.event as KeyboardEvent | undefined)?.key !== 'Enter' || !e.data) return;
      onOpenConversation(e.data.chat_id);
    },
    [onOpenConversation],
  );

  return (
    <div className="conversations-grid size-full">
      <GridView<ConversationRow>
        columnDefs={columnDefs}
        additionalGridOptions={{
          ...infiniteGridOptions,
          datasource,
          // The view owns the empty state; AG Grid's untranslated built-in overlay would sit on top of it.
          suppressNoRowsOverlay: true,
          rowHeight: CONVERSATIONS_ROW_HEIGHT,
          headerHeight: CONVERSATIONS_HEADER_HEIGHT,
          groupHeaderHeight: CONVERSATIONS_GROUP_HEADER_HEIGHT,
          onCellClicked,
          onCellKeyDown,
          rowClassRules: { 'cursor-pointer': ({ data }) => Boolean(data) },
        }}
        onGridReady={onGridReady}
        getRowId={({ data }) => data.chat_id}
        storageKey={CONVERSATIONS_STORAGE_KEY}
        isLiveData
        showColumnsPanel={isColumnsPanelOpen}
        toggleColumnsPanel={onToggleColumnsPanel}
      />
    </div>
  );
};

export default ConversationsList;
