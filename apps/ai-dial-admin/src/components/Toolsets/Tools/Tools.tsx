'use client';

import {
  AlertVariant,
  ButtonVariant,
  DialAlert,
  DialButton,
  DialLoader,
  DialNoDataContent,
  DialSwitch,
} from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { getAssetTools } from '@/src/app/[lang]/assets-toolsets/actions';
import { getTools } from '@/src/app/[lang]/toolsets/actions';
import Search from '@/src/components/Common/Search/Search';
import { ButtonsI18nKey, EntitiesI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Tool, Toolset } from '@/src/models/dial/toolset';
import { isEqual, uniq } from 'lodash';
import AddToolsModal from './AddToolsModal';
import ToolsFilter from './Filter/ToolsFilter';
import ToolItem from './ToolItem';
import { ToolFilter } from './type';
import { getFilteredTools } from './utils';
import { AssetToolset } from '@/src/models/dial/deployment-asset';

const filtersConfiguration = [
  ToolFilter.Enabled,
  ToolFilter.Disabled,
  ToolFilter.AutoDetected,
  ToolFilter.AddedManually,
];

interface Props {
  originalToolset: Toolset;
  selectedToolset?: Toolset;
  isAssetToolset?: boolean;
  readonly?: boolean;
  onChangeToolset?: (toolset: Toolset) => void;
}

const ToolsView: FC<Props> = ({ selectedToolset, isAssetToolset, readonly, originalToolset, onChangeToolset }) => {
  const t = useI18n();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(filtersConfiguration);
  const [pattern, setPattern] = useState('');
  const [useAllTools, setUseAllTools] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);

  const isNotSavedToolset = useMemo(() => {
    return originalToolset.endpoint !== selectedToolset?.endpoint;
  }, [originalToolset, selectedToolset]);

  const toolsCount = useMemo(() => {
    return uniq([
      ...availableTools.map((t) => t.name),
      ...(selectedToolset?.allowedTools || []).filter((t) => t !== ''),
    ]).length;
  }, [selectedToolset, availableTools]);

  const filteredTools = useMemo(() => {
    const patternLower = pattern.toLowerCase();

    return getFilteredTools(selectedToolset?.allowedTools || [], selectedFilters, availableTools).filter(
      (tool) => tool.toLowerCase().includes(patternLower) && tool !== '',
    );
  }, [pattern, selectedToolset?.allowedTools, selectedFilters, availableTools]);

  useEffect(() => {
    if (selectedToolset?.name) {
      setIsLoading(true);
      (isAssetToolset ? getAssetTools((selectedToolset as AssetToolset)?.path) : getTools(selectedToolset?.name)).then(
        (tools) => {
          setIsLoading(false);
          setAvailableTools(tools || []);
        },
      );
    }
  }, [selectedToolset?.name, isAssetToolset, isNotSavedToolset, selectedToolset?.endpoint, selectedToolset]);

  useEffect(() => {
    setUseAllTools(!selectedToolset?.allowedTools || selectedToolset?.allowedTools.length === 0);
  }, [selectedToolset]);

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const onAddTools = useCallback(
    (tools: string[]) => {
      onChangeToolset?.({
        ...selectedToolset,
        allowedTools: [...(selectedToolset?.allowedTools?.filter((t) => t !== '') || []), ...tools],
      });
    },
    [onChangeToolset, selectedToolset],
  );

  const onRemoveTool = useCallback(
    (tool: string) => {
      onChangeToolset?.({
        ...selectedToolset,
        allowedTools: [...(selectedToolset?.allowedTools?.filter((t) => t !== tool) || [])],
      });
    },
    [onChangeToolset, selectedToolset],
  );

  const onSelectAll = useCallback(() => {
    if (isEqual(filtersConfiguration, selectedFilters)) {
      setSelectedFilters([]);
    } else {
      setSelectedFilters(filtersConfiguration);
    }
  }, [selectedFilters]);

  const onSelectFilter = useCallback(
    (value: boolean | undefined, filter: ToolFilter) => {
      if (value) {
        setSelectedFilters((prev) => [...prev, filter]);
      } else {
        setSelectedFilters((prev) => prev.filter((f) => f !== filter));
      }
    },
    [setSelectedFilters],
  );

  const onChangeTools = useCallback(
    (value: boolean, tool: string) => {
      if (value) {
        onChangeToolset?.({
          ...selectedToolset,
          allowedTools: [...(selectedToolset?.allowedTools?.filter((t) => t !== '') || []), tool],
        });
      } else {
        onChangeToolset?.({
          ...selectedToolset,
          allowedTools: selectedToolset?.allowedTools?.filter((t) => t !== tool),
        });
      }
    },
    [onChangeToolset, selectedToolset],
  );

  return (
    <>
      {isLoading ? (
        <DialLoader size={40} />
      ) : (
        <div className="w-full flex flex-col h-full gap-y-2">
          <div className="flex flex-row items-center mb-3">
            <h1 className="mr-4">
              {t(ToolsetI18nKey.Tools)}
              {`: ${toolsCount}`}
            </h1>

            {!readonly && (
              <DialSwitch
                switchId="useAllTools"
                title={t(ToolsetI18nKey.UseAllTools)}
                isOn={useAllTools}
                onChange={(value) =>
                  onChangeToolset?.({
                    ...selectedToolset,
                    allowedTools: value
                      ? []
                      : originalToolset.allowedTools?.length
                        ? [...originalToolset.allowedTools]
                        : [''],
                  })
                }
              />
            )}
          </div>
          <div className="flex flex-row items-center mb-3 justify-between">
            <div className="w-[480px]">
              <Search onChange={(search) => setPattern(search)} />
            </div>

            {!useAllTools && (
              <div className="flex items-center gap-x-6">
                <ToolsFilter
                  isAllSelected={isEqual(filtersConfiguration, selectedFilters)}
                  onSelectAll={onSelectAll}
                  selectedFilters={selectedFilters}
                  onSelectFilter={onSelectFilter}
                />
                {!readonly && (
                  <DialButton
                    variant={ButtonVariant.Primary}
                    title={t(ButtonsI18nKey.Add)}
                    iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
                    onClick={onOpenModal}
                  />
                )}
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0">
            {!filteredTools || filteredTools.length === 0 ? (
              <DialNoDataContent title={t(EntitiesI18nKey.NoTools)} />
            ) : (
              <div className="h-full overflow-y-auto flex flex-col gap-y-3 pr-2">
                {filteredTools?.map((tool) => (
                  <ToolItem
                    key={tool}
                    tool={tool}
                    onRemoveTool={selectedToolset ? onRemoveTool : void 0}
                    isEnabled={selectedToolset?.allowedTools?.includes(tool)}
                    isAddedManual={!availableTools.some((t) => t.name === tool)}
                    readonly={useAllTools || !availableTools.some((t) => t.name === tool)}
                    onChangeIsEnabled={(v) => onChangeTools(v, tool)}
                  />
                ))}
              </div>
            )}
          </div>
          {!useAllTools && !readonly && <span className="tiny text-secondary">{t(ToolsetI18nKey.Warning)}</span>}
          {isNotSavedToolset && !readonly && (
            <DialAlert variant={AlertVariant.Info} message={t(ToolsetI18nKey.ToolsWarning)} />
          )}
        </div>
      )}
      {isModalOpen && <AddToolsModal isModalOpen={isModalOpen} onClose={onCloseModal} onSelectItems={onAddTools} />}
    </>
  );
};

export default ToolsView;
