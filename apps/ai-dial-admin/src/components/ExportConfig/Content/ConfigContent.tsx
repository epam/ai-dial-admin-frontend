'use client';
import { Dispatch, FC, SetStateAction, useEffect, useMemo, useState } from 'react';

import { getEntities } from '@/src/app/[lang]/export-config/actions';
import Loader from '@/src/components/Common/Loader/Loader';
import Tabs from '@/src/components/Common/Tabs/Tabs';
import AddEntitiesButton from '@/src/components/ExportConfig/AddEntities/AddEntitiesButton';
import { getActualTabs } from '@/src/components/ExportConfig/Content/ConfigContent.utils';
import ConfigContentGrid from '@/src/components/ExportConfig/Content/ConfigContentGrid';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportDependenciesConfig } from '@/src/models/export';
import { ExportFormat, ExportType } from '@/src/types/export';
import { EntityType } from '@/src/types/entity-type';

interface Props {
  selectedExportFormat: ExportFormat;
  dependencies: ExportDependenciesConfig;
  selectedExportType: ExportType;
  customExportData: Record<string, EntitiesGridData[]>;
  setCustomExportData: Dispatch<SetStateAction<Record<string, EntitiesGridData[]>>>;
}

const ConfigContent: FC<Props> = ({
  customExportData,
  setCustomExportData,
  dependencies,
  selectedExportFormat,
  selectedExportType,
}) => {
  const t = useI18n() as (v: string) => string;

  const [selectedTab, setSelectedTab] = useState('');
  const [selectedTabTitle, setSelectedTabTitle] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [tabData, setTabData] = useState<Record<string, EntitiesGridData[]>>({});

  const tabs = useMemo(() => {
    return getActualTabs(selectedExportType, selectedExportFormat, dependencies, t);
  }, [selectedExportType, selectedExportFormat, dependencies, t]);

  useEffect(() => {
    setSelectedTab(tabs?.[0]?.id);
  }, [tabs]);

  useEffect(() => {
    if (selectedTab) {
      setSelectedTabTitle(tabs.find((t) => t.id === selectedTab)?.name as string);

      if (!tabData[selectedTab]) {
        setIsLoadingData(true);
        getEntities(selectedTab).then((data) => {
          setTabData((prev) => ({ ...prev, [selectedTab]: data }));
          setIsLoadingData(false);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  return (
    <div className="flex-1 min-w-0 bg-layer-3 rounded p-4 flex flex-col h-full">
      <Tabs tabs={tabs} activeTab={selectedTab} onClick={(tab) => setSelectedTab(tab)} />
      <div className="flex-1 min-h-0 mt-4">
        <div className="h-full flex flex-col">
          {selectedTab && (
            <div className="flex flex-row justify-between items-center h-[38px] mb-4">
              <h3>
                {`${selectedTabTitle}: `}
                {(selectedExportType === ExportType.Full
                  ? tabData[selectedTab]?.length
                  : customExportData[selectedTab]?.length) || 0}
              </h3>
              {selectedExportType === ExportType.Custom && (
                <AddEntitiesButton
                  selectedTab={selectedTab as EntityType}
                  tabData={tabData}
                  customExportData={customExportData}
                  setCustomExportData={setCustomExportData}
                />
              )}
            </div>
          )}
          <div className="flex-1 min-h-0">
            {isLoadingData ? (
              <Loader size={50} />
            ) : (
              <ConfigContentGrid
                selectedTab={selectedTab as EntityType}
                tabData={tabData}
                isFull={selectedExportType === ExportType.Full}
                customExportData={customExportData}
                setCustomExportData={setCustomExportData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigContent;
