'use client';

import { FC } from 'react';
import { DialCheckbox, DialDropdown } from '@epam/ai-dial-ui-kit';

import SelectedFilter from './SelectedFilter';
import { ToolFilter } from '../type';
import { ToolsetI18nKey, BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  isAllSelected: boolean;
  selectedFilters: ToolFilter[];
  onSelectAll: () => void;
  onSelectFilter: (value: boolean | undefined, filter: ToolFilter) => void;
}

const ToolsFilter: FC<Props> = ({ isAllSelected, onSelectFilter, selectedFilters, onSelectAll }) => {
  const t = useI18n();

  return (
    <DialDropdown
      listClassName="w-[200px]"
      renderOverlay={() => (
        <div className="bg-layer-0 rounded flex flex-col w-[200px]">
          <div className="py-2 px-4">
            <DialCheckbox
              checked={isAllSelected}
              id={ToolFilter.All}
              label={t(ToolsetI18nKey.AllTools)}
              onChange={onSelectAll}
            />
          </div>
          <div className="flex flex-col pl-[20px]">
            <div className="py-2 px-4">
              <DialCheckbox
                checked={selectedFilters.includes(ToolFilter.Enabled)}
                id={ToolFilter.Enabled}
                label={t(BasicI18nKey.Enabled)}
                onChange={(value) => onSelectFilter(value, ToolFilter.Enabled)}
              />
            </div>
            <div className="py-2 px-4">
              <DialCheckbox
                checked={selectedFilters.includes(ToolFilter.Disabled)}
                id={ToolFilter.Disabled}
                label={t(BasicI18nKey.Disabled)}
                onChange={(value) => onSelectFilter(value, ToolFilter.Disabled)}
              />
            </div>

            <div className="py-2 px-4">
              <DialCheckbox
                checked={selectedFilters.includes(ToolFilter.AutoDetected)}
                id={ToolFilter.AutoDetected}
                label={t(ToolsetI18nKey.AutoDetected)}
                onChange={(value) => onSelectFilter(value, ToolFilter.AutoDetected)}
              />
            </div>
            <div className="py-2 px-4">
              <DialCheckbox
                checked={selectedFilters.includes(ToolFilter.AddedManually)}
                id={ToolFilter.AddedManually}
                label={t(ToolsetI18nKey.AddedManually)}
                onChange={(value) => onSelectFilter(value, ToolFilter.AddedManually)}
              />
            </div>
          </div>
        </div>
      )}
      trigger={<SelectedFilter selectedFilters={selectedFilters} />}
    />
  );
};

export default ToolsFilter;
