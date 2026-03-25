'use client';
import { DialLoader, DialNeutralButton, DialTabs } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { getDeploymentEntities } from '@/src/app/[lang]/export-config/actions';
import AddEntitiesModal from '@/src/components/ExportConfig/AddEntities/AddEntitiesModal';
import {
  getDeploymentButtonTitle,
  getDeploymentColDefs,
  getDeploymentTabs,
} from '@/src/components/ExportConfig/deployment-utils';
import GridView from '@/src/components/Grid/GridView/GridView';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportFormat } from '@/src/types/export';
import { EntityType } from '@/src/types/entity-type';
import { ColDef, GridApi, GridReadyEvent } from 'ag-grid-community';
import { getAvailableEntities } from '@/src/components/AddEntitiesTab/utils';

interface Props {
  customExportData: Record<string, EntitiesGridData[]>;
  setCustomExportData: Dispatch<SetStateAction<Record<string, EntitiesGridData[]>>>;
}

const DeploymentConfigContent: FC<Props> = ({ customExportData, setCustomExportData }) => {
  const t = useI18n();

  const [selectedTab, setSelectedTab] = useState('');
  const [selectedTabTitle, setSelectedTabTitle] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [tabData, setTabData] = useState<Record<string, EntitiesGridData[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi>();
  const [colDefs, setColDefs] = useState<ColDef[]>([]);
  const [rowData, setRowData] = useState<EntitiesGridData[]>([]);

  const customExportDataRef = useRef(customExportData?.[selectedTab]);

  useEffect(() => {
    customExportDataRef.current = customExportData?.[selectedTab];
  }, [customExportData, selectedTab]);

  const tabs = useMemo(() => getDeploymentTabs(t), [t]);

  useEffect(() => {
    setSelectedTab(tabs?.[0]?.id);
  }, [tabs]);

  useEffect(() => {
    if (selectedTab) {
      setSelectedTabTitle(tabs.find((tab) => tab.id === selectedTab)?.label as string);

      if (!tabData[selectedTab]) {
        setIsLoadingData(true);
        getDeploymentEntities(selectedTab).then((data) => {
          setTabData((prev) => ({ ...prev, [selectedTab]: data }));
          setIsLoadingData(false);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  const onRemove = useCallback(
    (entity?: EntitiesGridData) => {
      if (customExportDataRef.current && setCustomExportData) {
        const newData = customExportDataRef.current.filter((d) => d.name !== entity?.name);
        setCustomExportData((prev) => ({
          ...prev,
          [selectedTab]: newData,
        }));
      }
    },
    [selectedTab, setCustomExportData],
  );

  useEffect(() => {
    if (selectedTab) {
      const data = customExportData?.[selectedTab] || [];
      const columns = getDeploymentColDefs(t, onRemove, selectedTab);
      setColDefs(columns);
      setRowData(data);
      gridApi?.setFilterModel(null);
      gridApi?.refreshHeader();
      gridApi?.updateGridOptions({ rowData: data, columnDefs: columns });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, customExportData]);

  const onGridReady = (event: GridReadyEvent) => {
    setGridApi(event.api);
    event.api?.updateGridOptions({ columnDefs: colDefs, rowData });
  };

  const onAddClick = () => {
    setIsModalOpen(true);
  };

  const onAddEntities = (entities: EntitiesGridData[]) => {
    setCustomExportData((prev) => ({
      ...prev,
      [selectedTab]: [...(prev[selectedTab] ?? []), ...entities],
    }));
    setIsModalOpen(false);
  };

  const availableEntities = useMemo(() => {
    const all = tabData[selectedTab] || [];
    const existing = customExportData[selectedTab] || [];
    return getAvailableEntities(existing, all);
  }, [tabData, customExportData, selectedTab]);

  const modalColumnDefs = useMemo(() => getDeploymentColDefs(t, undefined, selectedTab), [t, selectedTab]);

  const itemsCount = customExportData?.[selectedTab]?.length || 0;

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
              <DialNeutralButton
                label={getDeploymentButtonTitle(t, selectedTab)}
                iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
                onClick={onAddClick}
              />
            </div>
          )}
          <div className="flex-1 min-h-0">
            {isLoadingData ? (
              <DialLoader size={50} />
            ) : (
              <GridView
                getIsEmptyData={() => rowData.length === 0}
                emptyDataProps={{ title: `No ${selectedTabTitle?.toLowerCase() || 'entities'} selected` }}
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

export default DeploymentConfigContent;
