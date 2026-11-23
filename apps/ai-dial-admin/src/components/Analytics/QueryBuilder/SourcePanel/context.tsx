'use client';

import {
  FC,
  MouseEvent,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import { getEntitySchema } from '@/src/app/[lang]/queries/actions';
import {
  ColumnLoad,
  ColumnLoadStatus,
  PendingNavigation,
  QueryScopeFilter,
  SourcePanelContextValue,
  SourcePanelTab,
  SourceTable,
} from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import DiscardModal from '@/src/components/EntityView/Modals/Discard/Discard';
import { QueryBuilderI18nKey, QuerySourcePanelI18nKey } from '@/src/constants/i18n';
import { useReadFailureNotification } from '@/src/hooks/use-read-failure-notification';
import { SavedQuery } from '@/src/models/analytics/saved-query';
import { ReadFailure } from '@/src/models/server-action';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';

interface Props {
  tables: SourceTable[];
  queries: SavedQuery[];
  tablesFailure?: ReadFailure | null;
  queriesFailure?: ReadFailure | null;
  children: ReactNode;
}

interface UnsavedWork {
  hasUnsavedWork: boolean;
  onDiscard?: () => void;
}

const LOCAL_STORAGE_COLLAPSED_KEY = 'query-builder-source-panel-collapsed';

const toggled = (list: string[], item: string): string[] =>
  list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];

const isPlainClick = (event: MouseEvent): boolean =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const SourcePanelContext = createContext<SourcePanelContextValue | null>(null);

export const SourcePanelProvider: FC<Props> = ({ tables, queries, tablesFailure, queriesFailure, children }) => {
  const router = useRouter();

  useReadFailureNotification(tablesFailure, QueryBuilderI18nKey.EntitiesLoadFailed);
  useReadFailureNotification(queriesFailure, QuerySourcePanelI18nKey.QueriesLoadFailed);

  const [selectedTab, setSelectedTab] = useState<SourcePanelTab | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [querySearch, setQuerySearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState(QueryScopeFilter.All);
  const [expandedTables, setExpandedTables] = useState<string[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [columns, setColumns] = useState<Record<string, ColumnLoad>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [draftTable, setDraftTable] = useState<string | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);

  const unsavedWork = useRef<UnsavedWork>({ hasUnsavedWork: false });
  const scrollPositions = useRef<Partial<Record<SourcePanelTab, number>>>({});
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  useEffect(() => {
    setIsCollapsed(getFromLocalStorage(LOCAL_STORAGE_COLLAPSED_KEY) === 'true');
  }, []);

  const onToggleCollapsed = useCallback((next: boolean) => {
    setIsCollapsed(next);
    setToLocalStorage(LOCAL_STORAGE_COLLAPSED_KEY, String(next));
  }, []);

  const onLoadColumns = useCallback(async (name: string) => {
    setColumns((prev) => ({ ...prev, [name]: { status: ColumnLoadStatus.Loading, fields: [] } }));
    let next: ColumnLoad = { status: ColumnLoadStatus.Failed, fields: [] };
    try {
      const res = await getEntitySchema(name);
      if (res.response) next = { status: ColumnLoadStatus.Loaded, fields: res.response.fields ?? [] };
    } catch {
      next = { status: ColumnLoadStatus.Failed, fields: [] };
    }
    setColumns((prev) => ({ ...prev, [name]: next }));
  }, []);

  const onToggleTable = useCallback(
    (name: string) => {
      setExpandedTables((prev) => toggled(prev, name));
      if (!columnsRef.current[name]) void onLoadColumns(name);
    },
    [onLoadColumns],
  );

  const onToggleGroup = useCallback((key: string) => setCollapsedGroups((prev) => toggled(prev, key)), []);

  const onRegisterUnsavedWork = useCallback((hasUnsavedWork: boolean, onDiscard?: () => void) => {
    unsavedWork.current = { hasUnsavedWork, onDiscard };
  }, []);

  const onNavigate = useCallback((event: MouseEvent<HTMLAnchorElement>, href: string, nextDraftTable?: string) => {
    if (!isPlainClick(event)) return;
    if (unsavedWork.current.hasUnsavedWork) {
      event.preventDefault();
      setPendingNavigation({ href, draftTable: nextDraftTable });
      return;
    }
    if (nextDraftTable) setDraftTable(nextDraftTable);
  }, []);

  const onConfirmLeave = useCallback(() => {
    if (!pendingNavigation) return;
    unsavedWork.current.onDiscard?.();
    if (pendingNavigation.draftTable) setDraftTable(pendingNavigation.draftTable);
    router.push(pendingNavigation.href);
    setPendingNavigation(null);
  }, [pendingNavigation, router]);

  const onCancelLeave = useCallback(() => setPendingNavigation(null), []);

  const value = useMemo<SourcePanelContextValue>(
    () => ({
      tables,
      queries,
      selectedTab,
      onSelectTab: setSelectedTab,
      tableSearch,
      onChangeTableSearch: setTableSearch,
      querySearch,
      onChangeQuerySearch: setQuerySearch,
      scopeFilter,
      onChangeScopeFilter: setScopeFilter,
      expandedTables,
      onToggleTable,
      collapsedGroups,
      onToggleGroup,
      columns,
      onLoadColumns,
      scrollPositions,
      isCollapsed,
      onToggleCollapsed,
      draftTable,
      onNavigate,
      onRegisterUnsavedWork,
    }),
    [
      tables,
      queries,
      selectedTab,
      tableSearch,
      querySearch,
      scopeFilter,
      expandedTables,
      onToggleTable,
      collapsedGroups,
      onToggleGroup,
      columns,
      onLoadColumns,
      isCollapsed,
      onToggleCollapsed,
      draftTable,
      onNavigate,
      onRegisterUnsavedWork,
    ],
  );

  return (
    <SourcePanelContext.Provider value={value}>
      {children}
      {pendingNavigation && (
        <DiscardModal onConfirm={onConfirmLeave} onClose={onCancelLeave} onCancel={onCancelLeave} />
      )}
    </SourcePanelContext.Provider>
  );
};

export const useSourcePanel = (): SourcePanelContextValue => {
  const ctx = useContext(SourcePanelContext);
  if (!ctx) throw new Error('useSourcePanel must be used within SourcePanelProvider');
  return ctx;
};

export const useSourcePanelTabSelect = (): ((tab: SourcePanelTab) => void) | undefined =>
  useContext(SourcePanelContext)?.onSelectTab;

export const useSourceTableDescription = (name: string): string | undefined =>
  useContext(SourcePanelContext)?.tables.find((table) => table.name === name)?.description;

export const useSourcePanelUnsavedWork = (hasUnsavedWork: boolean, onDiscard?: () => void): void => {
  const register = useContext(SourcePanelContext)?.onRegisterUnsavedWork;

  useEffect(() => {
    register?.(hasUnsavedWork, onDiscard);
    return () => register?.(false);
  }, [register, hasUnsavedWork, onDiscard]);
};
