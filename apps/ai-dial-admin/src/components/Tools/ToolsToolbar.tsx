import { FC } from 'react';

import { PrimaryButton, Switch } from '@epam/ai-dial-ui-kit';
import { IconPencilMinus } from '@tabler/icons-react';

import Search from '@/src/components/Common/Search/Search';
import { TOOL_FILTERS_CONFIGURATION } from '@/src/components/Tools/constants';
import DebouncedToolsSearch from '@/src/components/Tools/DebouncedToolsSearch';
import ToolsFilter from '@/src/components/Tools/Filter/ToolsFilter';
import { ToolFilter } from '@/src/components/Tools/type';
import { ButtonsI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { isEqual } from 'lodash';

interface Props {
  toolsCount: number;
  isRunnerApplication?: boolean;
  isSearching: boolean;
  isManagementVisible: boolean;
  useAllTools: boolean;
  search: string;
  selectedFilters: ToolFilter[];
  onSearchChange: (value: string) => void;
  onSearchPendingChange: (isPending: boolean) => void;
  onUseAllToolsSwitch: (value: boolean) => void;
  onSelectAll: () => void;
  onSelectFilter: (value: boolean | undefined, filter: ToolFilter) => void;
  onOpenModal: () => void;
}

const ToolsToolbar: FC<Props> = ({
  toolsCount,
  isRunnerApplication,
  isSearching,
  isManagementVisible,
  useAllTools,
  search,
  selectedFilters,
  onSearchChange,
  onSearchPendingChange,
  onUseAllToolsSwitch,
  onSelectAll,
  onSelectFilter,
  onOpenModal,
}) => {
  const t = useI18n();

  return (
    <>
      <div className="flex flex-row items-center mb-3">
        <h1 className="mr-4">
          {t(ToolsetI18nKey.Tools)}
          {!isSearching && `: ${toolsCount}`}
        </h1>
        {isManagementVisible && (
          <Switch
            id="useAllTools"
            labelProps={{ label: t(ToolsetI18nKey.UseAllTools) }}
            isOn={useAllTools}
            onChange={onUseAllToolsSwitch}
          />
        )}
      </div>
      <div className="flex flex-row items-center mb-3 gap-x-4 justify-between">
        <div className="w-[480px]">
          {isRunnerApplication ? (
            <DebouncedToolsSearch onChange={onSearchChange} onPendingChange={onSearchPendingChange} value={search} />
          ) : (
            <Search onChange={onSearchChange} value={search} />
          )}
        </div>
        <div className="flex flex-row gap-4">
          {!useAllTools && isManagementVisible && (
            <div className="flex items-center gap-x-6">
              <ToolsFilter
                isAllSelected={isEqual(TOOL_FILTERS_CONFIGURATION, selectedFilters)}
                onSelectAll={onSelectAll}
                selectedFilters={selectedFilters}
                onSelectFilter={onSelectFilter}
              />
            </div>
          )}
          {!useAllTools && isManagementVisible && (
            <PrimaryButton
              label={t(ButtonsI18nKey.ManageTool)}
              iconBefore={<IconPencilMinus {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
              onClick={onOpenModal}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ToolsToolbar;
