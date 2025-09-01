'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import NoDataContent from '@/src/components/Common/NoData/NoData';
import { ButtonsI18nKey, EntitiesI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialToolset } from '@/src/models/dial/toolset';
import Search from '../../Common/Search/Search';
import Button from '../../Common/Button/Button';
import { IconPlus } from '@tabler/icons-react';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { PopUpState } from '@/src/types/pop-up';
import AddToolsModal from './AddToolsModal';

interface Props {
  selectedToolset: DialToolset;
  onChangeToolset: (toolset: DialToolset) => void;
}

const Tools: FC<Props> = ({ selectedToolset, onChangeToolset }) => {
  const t = useI18n();

  const [modalState, setModalState] = useState(PopUpState.Closed);
  const [pattern, setPattern] = useState('');

  const filteredTools = useMemo(() => {
    const patternLower = pattern.toLowerCase();
    return selectedToolset.allowedTools?.filter((tool) => tool.toLowerCase().includes(patternLower));
  }, [pattern, selectedToolset]);

  const onOpenModal = useCallback(() => {
    setModalState(PopUpState.Opened);
  }, [setModalState]);

  const onCloseModal = useCallback(() => {
    setModalState(PopUpState.Closed);
  }, [setModalState]);

  const onAddTools = useCallback(
    (tools: string[]) => {
      onChangeToolset({ ...selectedToolset, allowedTools: [...(selectedToolset.allowedTools || []), ...tools] });
    },
    [onChangeToolset, selectedToolset],
  );

  return (
    <>
      <div className="pt-3 w-full flex flex-col h-full">
        <div className="flex flex-row items-center mb-3">
          <h1>
            {t(ToolsetI18nKey.Tools)}
            {selectedToolset.allowedTools?.length ? `${selectedToolset.allowedTools?.length}:` : ''}
          </h1>
        </div>
        <div className="flex flex-row items-center mb-3 justify-between">
          <div className="w-[480px]">
            <Search onChange={(search) => setPattern(search)} />
          </div>

          <Button
            cssClass="primary"
            title={t(ButtonsI18nKey.Add)}
            iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
            onClick={onOpenModal}
          />
        </div>
        <div className="flex-1 min-h-0">
          {!selectedToolset?.allowedTools || selectedToolset?.allowedTools.length === 0 ? (
            <NoDataContent emptyDataTitle={t(EntitiesI18nKey.NoTools)} />
          ) : (
            filteredTools?.map((tool) => (
              <div
                key={tool}
                className="p-3 mb-2 border border-border rounded flex flex-row items-center justify-between"
              >
                <span>{tool}</span>
              </div>
            ))
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
