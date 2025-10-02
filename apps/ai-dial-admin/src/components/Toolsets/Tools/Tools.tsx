'use client';

import { IconPlus } from '@tabler/icons-react';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertVariant, DialAlert, DialSwitch } from '@epam/ai-dial-ui-kit';

import { getTools } from '@/src//app/[lang]/toolsets/actions';
import Button from '@/src/components/Common/Button/Button';
import Loader from '@/src/components/Common/Loader/Loader';
import NoDataContent from '@/src/components/Common/NoData/NoData';
import Search from '@/src/components/Common/Search/Search';
import { ButtonsI18nKey, EntitiesI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { Tool, Toolset } from '@/src/models/dial/toolset';
import { PopUpState } from '@/src/types/pop-up';
import { isEqual, uniq } from 'lodash';
import AddToolsModal from './AddToolsModal';
import ToolsFilter from './Filter/ToolsFilter';
import ToolItem from './ToolItem';
import { ToolFilter } from './type';
import { getFilteredTools } from './utils';

const filtersConfiguration = [
  ToolFilter.Enabled,
  ToolFilter.Disabled,
  ToolFilter.AutoDetected,
  ToolFilter.AddedManually,
];

interface Props {
  originalToolset: Toolset;
  selectedToolset: Toolset;
  onChangeToolset: (toolset: Toolset) => void;
}

const ToolView: FC<Props> = ({ selectedToolset, originalToolset, onChangeToolset }) => {
  const t = useI18n();

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [selectedFilters, setSelectedFilters] = useState(filtersConfiguration);
  const [pattern, setPattern] = useState('');
  const [useAllTools, setUseAllTools] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);

  const isNotSavedToolset = useMemo(() => {
    return originalToolset.endpoint !== selectedToolset.endpoint;
  }, [originalToolset, selectedToolset]);

  const toolsCount = useMemo(() => {
    return uniq([...availableTools.map((t) => t.name), ...(selectedToolset.allowedTools || []).filter((t) => t !== '')])
      .length;
  }, [selectedToolset.allowedTools, availableTools]);

  const filteredTools = useMemo(() => {
    const patternLower = pattern.toLowerCase();

    return getFilteredTools(selectedToolset.allowedTools || [], selectedFilters, availableTools).filter(
      (tool) => tool.toLowerCase().includes(patternLower) && tool !== '',
    );
  }, [pattern, selectedToolset.allowedTools, selectedFilters, availableTools]);

  useEffect(() => {
    if (selectedToolset.name) {
      setIsLoading(true);
      getTools(selectedToolset.name).then((tools) => {
        setIsLoading(false);
        setAvailableTools(tools || []);
      });
    }
  }, [selectedToolset.name, isNotSavedToolset, selectedToolset.endpoint]);

  useEffect(() => {
    setUseAllTools(!selectedToolset.allowedTools || selectedToolset.allowedTools.length === 0);
  }, [selectedToolset]);

  const onOpenModal = useCallback(() => {
    setModalState(PopUpState.Opened);
  }, [setModalState]);

  const onCloseModal = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, [setModalState]);

  const onAddTools = useCallback(
    (tools: string[]) => {
      onChangeToolset({
        ...selectedToolset,
        allowedTools: [...(selectedToolset.allowedTools?.filter((t) => t !== '') || []), ...tools],
      });
    },
    [onChangeToolset, selectedToolset],
  );

  const onRemoveTool = useCallback(
    (tool: string) => {
      onChangeToolset({
        ...selectedToolset,
        allowedTools: [...(selectedToolset.allowedTools?.filter((t) => t !== tool) || [])],
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
        onChangeToolset({
          ...selectedToolset,
          allowedTools: [...(selectedToolset.allowedTools?.filter((t) => t !== '') || []), tool],
        });
      } else {
        onChangeToolset({
          ...selectedToolset,
          allowedTools: selectedToolset.allowedTools?.filter((t) => t !== tool),
        });
      }
    },
    [onChangeToolset, selectedToolset],
  );

  return (
    <>
      {isLoading ? (
        <Loader size={40} />
      ) : (
        <div className="pt-3 w-full flex flex-col h-full gap-y-2">
          <div className="flex flex-row items-center mb-3">
            <h1 className="mr-4">
              {t(ToolsetI18nKey.Tools)}
              {`: ${toolsCount}`}
            </h1>

            <DialSwitch
              switchId="useAllTools"
              title={t(ToolsetI18nKey.UseAllTools)}
              isOn={useAllTools}
              onChange={(value) =>
                onChangeToolset({
                  ...selectedToolset,
                  allowedTools: value ? [] : ['' /* to trigger validation error */],
                })
              }
            />
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
                <Button
                  cssClass="primary"
                  title={t(ButtonsI18nKey.Add)}
                  iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
                  onClick={onOpenModal}
                />
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0">
            {!filteredTools || filteredTools.length === 0 ? (
              <NoDataContent emptyDataTitle={t(EntitiesI18nKey.NoTools)} />
            ) : (
              <div className="h-full overflow-y-auto flex flex-col gap-y-3 pr-2">
                {filteredTools?.map((tool) => (
                  <ToolItem
                    key={tool}
                    tool={tool}
                    onRemoveTool={onRemoveTool}
                    isEnabled={selectedToolset.allowedTools?.includes(tool)}
                    isAddedManual={!availableTools.some((t) => t.name === tool)}
                    readonly={useAllTools || !availableTools.some((t) => t.name === tool)}
                    onChangeIsEnabled={(v) => onChangeTools(v, tool)}
                  />
                ))}
              </div>
            )}
          </div>
          {!useAllTools && <span className="tiny text-secondary">{t(ToolsetI18nKey.Warning)}</span>}
          {isNotSavedToolset && <DialAlert variant={AlertVariant.Info} message={t(ToolsetI18nKey.ToolsWarning)} />}
        </div>
      )}
      {modalState === PopUpState.Opened && (
        <AddToolsModal modalState={modalState} onClose={onCloseModal} onSelectItems={onAddTools} />
      )}
    </>
  );
};

export default ToolView;
