'use client';

import { GridReadyEvent, IDatasource } from 'ag-grid-community';
import { FC, useMemo } from 'react';

import GridView from '@/src/components/Grid/GridView/GridView';
import { infiniteGridOptions } from '@/src/constants/ag-grid';
import {
  CONVERSATIONS_GROUP_HEADER_HEIGHT,
  CONVERSATIONS_HEADER_HEIGHT,
  CONVERSATIONS_ROW_HEIGHT,
} from '@/src/constants/analytics/conversations-trace';
import { CONVERSATIONS_TRACE_COLUMN_GROUPS } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

interface Props {
  datasource: IDatasource;
  onGridReady: (event: GridReadyEvent) => void;
}

const ConversationsList: FC<Props> = ({ datasource, onGridReady }) => {
  const t = useI18n();

  const columnDefs = useMemo(() => CONVERSATIONS_TRACE_COLUMN_GROUPS(t), [t]);

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
        }}
        onGridReady={onGridReady}
        getRowId={({ data }) => data.chat_id}
      />
    </div>
  );
};

export default ConversationsList;
