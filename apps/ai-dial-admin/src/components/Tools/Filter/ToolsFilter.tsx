'use client';

import { Checkbox, Dropdown } from '@epam/ai-dial-ui-kit';
import { FC, useState } from 'react';

import { ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolFilter } from '../type';
import SelectedFilter from './SelectedFilter';

/** Restates the ui-kit 2.0 floating surface and menu row — the same way `TimeFilter` does. */
const LIST_CLASS = '!rounded-xl p-1 !shadow-md ![background-color:var(--bg-layer-raised, #fcfcfc)]';
const ROW_CLASS = 'flex h-[40px] items-center rounded-lg px-3 hover:bg-control-accent-alpha-hover';

interface Props {
  isAllSelected: boolean;
  selectedFilters: ToolFilter[];
  onSelectAll: () => void;
  onSelectFilter: (value: boolean | undefined, filter: ToolFilter) => void;
}

const ToolsFilter: FC<Props> = ({ isAllSelected, onSelectFilter, selectedFilters, onSelectAll }) => {
  const t = useI18n();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <Dropdown
      open={isDropdownOpen}
      onOpenChange={setIsDropdownOpen}
      allowedPlacements={['bottom-start', 'bottom-end']}
      matchReferenceWidth={false}
      listClassName={LIST_CLASS}
      renderOverlay={() => (
        <div className="flex min-w-[200px] flex-col">
          <div className={ROW_CLASS}>
            <Checkbox
              isSelected={isAllSelected}
              id={ToolFilter.All}
              labelProps={{ label: t(ToolsetI18nKey.AllTools) }}
              onChange={onSelectAll}
            />
          </div>
          <div className="flex flex-col pl-5">
            <div className={ROW_CLASS}>
              <Checkbox
                isSelected={selectedFilters.includes(ToolFilter.AutoDetected)}
                id={ToolFilter.AutoDetected}
                labelProps={{ label: t(ToolsetI18nKey.AutoDetected) }}
                onChange={(value) => onSelectFilter(value, ToolFilter.AutoDetected)}
              />
            </div>
            <div className={ROW_CLASS}>
              <Checkbox
                isSelected={selectedFilters.includes(ToolFilter.AddedManually)}
                id={ToolFilter.AddedManually}
                labelProps={{ label: t(ToolsetI18nKey.AddedManually) }}
                onChange={(value) => onSelectFilter(value, ToolFilter.AddedManually)}
              />
            </div>
          </div>
        </div>
      )}
    >
      <SelectedFilter selectedFilters={selectedFilters} isAllSelected={isAllSelected} isDropdownOpen={isDropdownOpen} />
    </Dropdown>
  );
};

export default ToolsFilter;
