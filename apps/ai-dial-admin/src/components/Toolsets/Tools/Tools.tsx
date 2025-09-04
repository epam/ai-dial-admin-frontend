'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { IconPlus } from '@tabler/icons-react';

import NoDataContent from '@/src/components/Common/NoData/NoData';
import { ButtonsI18nKey, EntitiesI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialToolset } from '@/src/models/dial/toolset';
import Search from '@/src/components/Common/Search/Search';
import Button from '@/src/components/Common/Button/Button';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { PopUpState } from '@/src/types/pop-up';
import AddToolsModal from './AddToolsModal';
import ToolItem from './ToolItem';
import Switch from '@/src/components/Common/Switch/Switch';

// TODO: remove after support api
const availableTools = ['Browser', 'Calculator', 'Calendar', 'Email'];
interface Props {
  selectedToolset: DialToolset;
  onChangeToolset: (toolset: DialToolset) => void;
}

const Tools: FC<Props> = ({ selectedToolset, onChangeToolset }) => {
  const t = useI18n();

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [pattern, setPattern] = useState('');
  const [useAllTools, setUseAllTools] = useState(false);

  const filteredTools = useMemo(() => {
    const patternLower = pattern.toLowerCase();
    const manual = selectedToolset.allowedTools?.filter((t) => !availableTools.includes(t)) || [];
    return [...(availableTools || []), ...manual]?.filter(
      (tool) => tool.toLowerCase().includes(patternLower) && tool !== '',
    );
  }, [pattern, selectedToolset]);

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
      <div className="pt-3 w-full flex flex-col h-full">
        <div className="flex flex-row items-center mb-3">
          <h1 className="mr-4">
            {t(ToolsetI18nKey.Tools)}
            {selectedToolset.allowedTools?.length ? `: ${selectedToolset.allowedTools?.length}` : ''}
          </h1>

          <Switch
            switchId="useAllTools"
            title={t(ToolsetI18nKey.UseAllTools)}
            isOn={useAllTools}
            onChange={(value) =>
              onChangeToolset({ ...selectedToolset, allowedTools: value ? [] : ['' /* to trigger validation error */] })
            }
          />
        </div>
        <div className="flex flex-row items-center mb-3 justify-between">
          <div className="w-[480px]">
            <Search onChange={(search) => setPattern(search)} />
          </div>
          {!useAllTools && (
            <Button
              cssClass="primary"
              title={t(ButtonsI18nKey.Add)}
              iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
              onClick={onOpenModal}
            />
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
                  isEnabled={selectedToolset.allowedTools?.includes(tool)}
                  isAddedManual={!availableTools.includes(tool)}
                  readonly={useAllTools || !availableTools.includes(tool)}
                  onChangeIsEnabled={(v) => onChangeTools(v, tool)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {modalState === PopUpState.Opened && (
        <AddToolsModal modalState={modalState} onClose={onCloseModal} onSelectItems={onAddTools} />
      )}
    </>
  );
};

export default Tools;
