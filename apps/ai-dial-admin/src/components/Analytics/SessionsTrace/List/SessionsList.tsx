'use client';

import { CellClickedEvent, CellKeyDownEvent, GridReadyEvent, IDatasource } from 'ag-grid-community';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useMemo } from 'react';

import SessionValueFilter from '@/src/components/Analytics/SessionsTrace/List/SessionValueFilter';
import SessionValueFloatingFilter from '@/src/components/Analytics/SessionsTrace/List/SessionValueFloatingFilter';
import { sessionDetailHref } from '@/src/components/Analytics/SessionsTrace/utils';
import { navigateEntityUrl } from '@/src/components/EntityListView/utils/on-cell-clicked';
import GridView from '@/src/components/Grid/GridView/GridView';
import { infiniteGridOptions } from '@/src/constants/ag-grid';
import {
  SESSIONS_FLOATING_FILTER_HEIGHT,
  SESSIONS_GROUP_HEADER_HEIGHT,
  SESSIONS_HEADER_HEIGHT,
  SESSIONS_ROW_HEIGHT,
  SESSIONS_STORAGE_KEY,
  SESSION_VALUE_FILTER,
  SESSION_VALUE_FLOATING_FILTER,
} from '@/src/constants/analytics/sessions-trace';
import { SESSIONS_TRACE_COLUMN_GROUPS } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { SessionGridContext, SessionRow } from '@/src/models/analytics/sessions-trace';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';

const GRID_COMPONENTS = {
  [SESSION_VALUE_FILTER]: SessionValueFilter,
  [SESSION_VALUE_FLOATING_FILTER]: SessionValueFloatingFilter,
};

interface Props {
  datasource: IDatasource;
  gridContext: SessionGridContext;
  onGridReady: (event: GridReadyEvent) => void;
  schemaFields?: AnalyticsEntityField[] | null;
  isColumnsPanelOpen: boolean;
  onToggleColumnsPanel: () => void;
}

const SessionsList: FC<Props> = ({
  datasource,
  gridContext,
  onGridReady,
  schemaFields,
  isColumnsPanelOpen,
  onToggleColumnsPanel,
}) => {
  const t = useI18n();
  const router = useRouter();

  const columnDefs = useMemo(() => SESSIONS_TRACE_COLUMN_GROUPS(t, schemaFields ?? []), [t, schemaFields]);

  const onOpenSession = useCallback(
    (chatId: string, event?: MouseEvent | null) => navigateEntityUrl(sessionDetailHref(chatId), router.push, event),
    [router],
  );

  const onCellClicked = useCallback(
    (e: CellClickedEvent<SessionRow>) => {
      if (!e.data) return;
      onOpenSession(e.data.client_session_id, e.event as MouseEvent | undefined);
    },
    [onOpenSession],
  );

  const onCellKeyDown = useCallback(
    (e: CellKeyDownEvent<SessionRow>) => {
      if ((e.event as KeyboardEvent | undefined)?.key !== 'Enter' || !e.data) return;
      onOpenSession(e.data.client_session_id);
    },
    [onOpenSession],
  );

  return (
    <div className="sessions-grid size-full">
      <GridView<SessionRow>
        columnDefs={columnDefs}
        additionalGridOptions={{
          ...infiniteGridOptions,
          datasource,
          components: GRID_COMPONENTS,
          context: gridContext,
          // The view owns the empty state; AG Grid's untranslated built-in overlay would sit on top of it.
          suppressNoRowsOverlay: true,
          // An enrichment column's exposed name carries a dot (`session_insights.title`) and the rows
          // are flat maps keyed by that whole name, so the default path interpretation finds nothing.
          suppressFieldDotNotation: true,
          rowHeight: SESSIONS_ROW_HEIGHT,
          headerHeight: SESSIONS_HEADER_HEIGHT,
          groupHeaderHeight: SESSIONS_GROUP_HEADER_HEIGHT,
          // Pinned so the view can offset its empty state by a header height it knows rather than one it
          // infers. The value matches AG Grid's own default, so the grid renders exactly as before.
          floatingFiltersHeight: SESSIONS_FLOATING_FILTER_HEIGHT,
          onCellClicked,
          onCellKeyDown,
          rowClassRules: { 'cursor-pointer': ({ data }) => Boolean(data) },
        }}
        onGridReady={onGridReady}
        getRowId={({ data }) => data.client_session_id}
        storageKey={SESSIONS_STORAGE_KEY}
        isLiveData
        showColumnsPanel={isColumnsPanelOpen}
        toggleColumnsPanel={onToggleColumnsPanel}
      />
    </div>
  );
};

export default SessionsList;
