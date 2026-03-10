'use client';
import { DialLoader, DialTabs } from '@epam/ai-dial-ui-kit';
import { Dispatch, FC, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';

import { getEntities } from '@/src/app/[lang]/export-config/actions';
import AddEntitiesButton from '@/src/components/ExportConfig/AddEntities/AddEntitiesButton';
import ConfigContentGrid from '@/src/components/ExportConfig/Content/ConfigContentGrid';
import { getActualTabs } from '@/src/components/ExportConfig/Content/utils';
import { useI18n } from '@/src/locales/client';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { ExportDependenciesConfig } from '@/src/models/export';
import { EntityType } from '@/src/types/entity-type';
import { ExportFormat, ExportType } from '@/src/types/export';

interface Props {
  dependencies: ExportDependenciesConfig;
  selectedTopics: string[];
  selectedExportFormat: ExportFormat;
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
  selectedTopics,
}) => {
  const t = useI18n();

  const [selectedTab, setSelectedTab] = useState('');
  const [selectedTabTitle, setSelectedTabTitle] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [tabData, setTabData] = useState<Record<string, EntitiesGridData[]>>({});
  const [itemsCount, setItemsCount] = useState(0);

  const tabs = useMemo(() => {
    return getActualTabs(selectedExportType, selectedExportFormat, dependencies, t);
  }, [selectedExportType, selectedExportFormat, dependencies, t]);

  useEffect(() => {
    setSelectedTab(tabs?.[0]?.id);
  }, [tabs]);

  useEffect(() => {
    if (selectedTab) {
      setSelectedTabTitle(tabs.find((t) => t.id === selectedTab)?.label as string);

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

  const onChangeItemsCount = useCallback((count: number) => setItemsCount(count), []);

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
              {selectedExportType === ExportType.Custom && (
                <AddEntitiesButton
                  selectedExportFormat={selectedExportFormat}
                  selectedTab={selectedTab as EntityType}
                  tabData={tabData}
                  customExportData={customExportData}
                  setCustomExportData={setCustomExportData}
                  selectedTopics={selectedTopics}
                />
              )}
            </div>
          )}
          <div className="flex-1 min-h-0">
            {isLoadingData ? (
              <DialLoader size={50} />
            ) : (
              <ConfigContentGrid
                selectedTab={selectedTab as EntityType}
                tabData={tabData}
                isFull={selectedExportType === ExportType.Full}
                customExportData={customExportData}
                setCustomExportData={setCustomExportData}
                selectedTopics={selectedTopics}
                onChangeItemsCount={onChangeItemsCount}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigContent;
