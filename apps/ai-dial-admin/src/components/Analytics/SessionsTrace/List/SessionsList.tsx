'use client';

import { GridReadyEvent, IDatasource } from 'ag-grid-community';
import { FC, useMemo } from 'react';

import SessionValueFilter from '@/src/components/Analytics/SessionsTrace/List/SessionValueFilter';
import SessionValueFloatingFilter from '@/src/components/Analytics/SessionsTrace/List/SessionValueFloatingFilter';
import { useSessionGridStorage } from '@/src/components/Analytics/SessionsTrace/List/use-session-grid-storage';
import { sessionDetailHref } from '@/src/components/Analytics/SessionsTrace/utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { infiniteGridOptions } from '@/src/constants/ag-grid';
import {
  SESSIONS_FLOATING_FILTER_HEIGHT,
  SESSIONS_GROUP_HEADER_HEIGHT,
  SESSIONS_HEADER_HEIGHT,
  SESSIONS_ROW_HEIGHT,
  SESSION_VALUE_FILTER,
  SESSION_VALUE_FLOATING_FILTER,
} from '@/src/constants/analytics/sessions-trace';
import { SESSIONS_TRACE_COLUMN_GROUPS } from '@/src/constants/grid-columns/grid-columns';
import { useI18n } from '@/src/locales/client';
import { SessionGridContext, SessionRow } from '@/src/models/analytics/sessions-trace';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import { SessionsSource } from '@/src/models/analytics/sessions-source';

const GRID_COMPONENTS = {
  [SESSION_VALUE_FILTER]: SessionValueFilter,
  [SESSION_VALUE_FLOATING_FILTER]: SessionValueFloatingFilter,
};

interface Props {
  datasource: IDatasource;
  gridContext: SessionGridContext;
  onGridReady: (event: GridReadyEvent) => void;
  schemaFields?: AnalyticsEntityField[] | null;
  source: SessionsSource;
  isColumnsPanelOpen: boolean;
  onToggleColumnsPanel: () => void;
}

const getSessionRowHref = (row: unknown): string | undefined => {
  const sessionId = (row as SessionRow | undefined)?.client_session_id;
  return sessionId ? sessionDetailHref(sessionId) : undefined;
};

const SessionsList: FC<Props> = ({
  datasource,
  gridContext,
  onGridReady,
  schemaFields,
  source,
  isColumnsPanelOpen,
  onToggleColumnsPanel,
}) => {
  const t = useI18n();
  const storageKey = useSessionGridStorage(source.baseTable);

  const columnDefs = useMemo(
    () => SESSIONS_TRACE_COLUMN_GROUPS(t, schemaFields ?? [], source),
    [t, schemaFields, source],
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
          // The view owns the empty state; AG Grid's untranslated built-in overlays would sit on top of it.
          // A filtered empty result raises `noMatchingRows`, which `suppressNoRowsOverlay` does not cover.
          suppressOverlays: ['noRows', 'noMatchingRows'],
          // An enrichment column's exposed name carries a dot (`session_insights.title`) and the rows
          // are flat maps keyed by that whole name, so the default path interpretation finds nothing.
          suppressFieldDotNotation: true,
          rowHeight: SESSIONS_ROW_HEIGHT,
          headerHeight: SESSIONS_HEADER_HEIGHT,
          groupHeaderHeight: SESSIONS_GROUP_HEADER_HEIGHT,
          // Pinned so the view can offset its empty state by a header height it knows rather than one it
          // infers. The value matches AG Grid's own default, so the grid renders exactly as before.
          floatingFiltersHeight: SESSIONS_FLOATING_FILTER_HEIGHT,
        }}
        onGridReady={onGridReady}
        getRowId={({ data }) => data.client_session_id}
        getHref={getSessionRowHref}
        storageKey={storageKey}
        isLiveData
        showColumnsPanel={isColumnsPanelOpen}
        toggleColumnsPanel={onToggleColumnsPanel}
      />
    </div>
  );
};

export default SessionsList;
