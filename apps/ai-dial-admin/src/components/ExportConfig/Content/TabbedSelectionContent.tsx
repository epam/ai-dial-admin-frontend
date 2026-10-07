'use client';
import { DialLoader, DialNeutralButton, DialTabs, TabModel } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { getAvailableEntities } from '@/src/components/AddEntitiesTab/utils';
import AddEntitiesModal from '@/src/components/ExportConfig/AddEntities/AddEntitiesModal';
import GridView from '@/src/components/Grid/GridView/GridView';
import { ExportI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ServerActionResponse } from '@/src/models/server-action';
import { EntityType } from '@/src/types/entity-type';
import { ExportFormat } from '@/src/types/export';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  tabs: TabModel[];
  customExportData: Record<string, EntitiesGridData[]>;
  setCustomExportData: Dispatch<SetStateAction<Record<string, EntitiesGridData[]>>>;
  loadCandidates: (tab: string) => Promise<ServerActionResponse<EntitiesGridData[]>>;
  getColDefs: (tab: string, remove?: (entity?: EntitiesGridData) => void) => ColDef[];
  getAddButtonTitle: (tab: string) => string;
  getEmptyTitle: (tabTitle: string) => string;
  /** Lists every candidate read-only instead of the selection, as the Admin scope's Full config does. */
  isFull?: boolean;
}

/**
 * An export selection split into tabs: each tab reads its candidates when first opened, offers them in the
 * Add-entities modal, and lists what was picked — or, for a full export, lists every candidate. A failed read is
 * reported and not cached, so reopening the tab reads again.
 */
const TabbedSelectionContent: FC<Props> = ({
  tabs,
  customExportData,
  setCustomExportData,
  loadCandidates,
  getColDefs,
  getAddButtonTitle,
  getEmptyTitle,
  isFull,
}) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [selectedTab, setSelectedTab] = useState('');
  // Per tab, so a read that finishes after the user moved on does not clear the loader of the tab now shown.
  const [loadingTabs, setLoadingTabs] = useState<Record<string, boolean>>({});
  const [tabData, setTabData] = useState<Record<string, EntitiesGridData[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi>();
  const [colDefs, setColDefs] = useState<ColDef[]>([]);
  const [rowData, setRowData] = useState<EntitiesGridData[]>([]);

  const customExportDataRef = useRef(customExportData?.[selectedTab]);

  useEffect(() => {
    customExportDataRef.current = customExportData?.[selectedTab];
  }, [customExportData, selectedTab]);

  useEffect(() => {
    setSelectedTab(tabs?.[0]?.id);
  }, [tabs]);

  const selectedTabTitle = useMemo(
    () => (tabs.find((tab) => tab.id === selectedTab)?.label as string) ?? '',
    [tabs, selectedTab],
  );

  useEffect(() => {
    if (!selectedTab || tabData[selectedTab] || loadingTabs[selectedTab]) {
      return;
    }

    const tab = selectedTab;
    const readCandidates = async () => {
      setLoadingTabs((prev) => ({ ...prev, [tab]: true }));
      try {
        const res = await loadCandidates(tab);
        if (res.success) {
          setTabData((prev) => ({ ...prev, [tab]: res.response ?? [] }));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      } catch {
        // An unreachable service rejects the action instead of answering with an envelope.
        showNotification(getErrorNotification(t(ExportI18nKey.CandidatesReadFailed)));
      } finally {
        setLoadingTabs((prev) => ({ ...prev, [tab]: false }));
      }
    };

    void readCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  const onRemove = useCallback(
    (entity?: EntitiesGridData) => {
      if (customExportDataRef.current) {
        const newData = customExportDataRef.current.filter((d) => d.name !== entity?.name);
        setCustomExportData((prev) => ({ ...prev, [selectedTab]: newData }));
      }
    },
    [selectedTab, setCustomExportData],
  );

  useEffect(() => {
    if (selectedTab) {
      const data = (isFull ? tabData[selectedTab] : customExportData?.[selectedTab]) || [];
      const columns = isFull ? getColDefs(selectedTab) : getColDefs(selectedTab, onRemove);
      setColDefs(columns);
      setRowData(data);
      gridApi?.setFilterModel(null);
      gridApi?.refreshHeader();
      gridApi?.updateGridOptions({ rowData: data, columnDefs: columns });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, customExportData, tabData, isFull]);

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({ columnDefs: colDefs, rowData });
  };

  const onAddEntities = (entities: EntitiesGridData[]) => {
    setCustomExportData((prev) => ({
      ...prev,
      [selectedTab]: [...(prev[selectedTab] ?? []), ...entities],
    }));
    setIsModalOpen(false);
  };

  const availableEntities = useMemo(
    () => getAvailableEntities(customExportData[selectedTab] || [], tabData[selectedTab] || []),
    [tabData, customExportData, selectedTab],
  );

  const modalColumnDefs = useMemo(() => getColDefs(selectedTab), [getColDefs, selectedTab]);

  const isLoadingData = !!loadingTabs[selectedTab];

  const itemsCount = (isFull ? tabData[selectedTab] : customExportData?.[selectedTab])?.length || 0;

  return (
    <div className="flex-1 min-w-0 bg-layer-3 rounded p-4 flex flex-col h-full">
      {selectedTab && <DialTabs tabs={tabs} activeTab={selectedTab} onClick={(tab) => setSelectedTab(tab)} />}
      <div className="flex-1 min-h-0 mt-4">
        <div className="h-full flex flex-col">
          {selectedTab && (
            <div className="flex flex-row justify-between items-center h-[40px] mb-4">
              <h3>
                {`${selectedTabTitle}: `}
                {itemsCount}
              </h3>
              {!isFull && (
                <DialNeutralButton
                  label={getAddButtonTitle(selectedTab)}
                  iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                  onClick={() => setIsModalOpen(true)}
                />
              )}
            </div>
          )}
          <div className="flex-1 min-h-0">
            {isLoadingData ? (
              <DialLoader size={50} />
            ) : (
              <GridView
                getIsEmptyData={() => rowData.length === 0}
                emptyDataProps={{ title: getEmptyTitle(selectedTabTitle) }}
                onGridReady={onGridReady}
              />
            )}
          </div>
        </div>
      </div>

      {isModalOpen &&
        createPortal(
          <AddEntitiesModal
            selectedTab={selectedTab as EntityType}
            columnDefs={modalColumnDefs}
            selectedExportFormat={ExportFormat.ADMIN}
            isModalOpen={isModalOpen}
            entities={availableEntities}
            onClose={() => setIsModalOpen(false)}
            onApply={onAddEntities}
            disabledDependencies
          />,
          document.body,
        )}
    </div>
  );
};

export default TabbedSelectionContent;
