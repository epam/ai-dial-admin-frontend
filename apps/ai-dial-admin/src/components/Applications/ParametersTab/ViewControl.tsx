import { Dispatch, FC, SetStateAction, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import { ButtonsI18nKey, CompareI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { APPLICATION_JSON_TYPE } from '@/src/constants/request-headers';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { DialAttachmentData } from '@/src/models/attachment-data';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import { VisualizerConnectorRequests } from '@epam/ai-dial-shared';
import { DialConfirmationPopup } from '@epam/ai-dial-ui-kit';
import { VisualizerConnector } from '@epam/ai-dial-visualizer-connector';
import { ParamsView } from './types';

interface Props {
  items: DropdownItemsModel[];
  paramsView: ParamsView;
  setParamsView: Dispatch<SetStateAction<ParamsView>>;
  onSave?: () => void;
  isChanged?: boolean;
}

const ViewControl: FC<Props> = ({ items, paramsView, setParamsView, onSave, isChanged }) => {
  const t = useI18n();
  const { visualizerConnector } = useAppContext();

  const [nextView, setNextView] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const sendMessage = useCallback(async (visualizer?: VisualizerConnector | null) => {
    const messagePayload: DialAttachmentData = {
      mimeType: APPLICATION_JSON_TYPE,
      visualizerData: {
        saveChanges: true,
        layout: { width: 0, height: 0 },
      },
    };
    visualizer?.send(VisualizerConnectorRequests.sendVisualizeData, messagePayload);
  }, []);

  const onChange = useCallback(
    (value: string) => {
      if (isChanged) {
        setNextView(value);
        setIsModalOpen(true);
      } else {
        setParamsView(value as ParamsView);
      }
    },
    [isChanged, setParamsView],
  );

  const onCancel = useCallback(() => {
    setNextView(null);
    setIsModalOpen(false);
  }, []);

  const onConfirm = useCallback(() => {
    if (paramsView === ParamsView.UI) {
      sendMessage(visualizerConnector);
      // need to wait saving until change tab
      setTimeout(() => {
        setParamsView(nextView as ParamsView);
        onCancel();
      }, 2000);
    } else {
      onSave?.();
    }
  }, [nextView, onCancel, onSave, paramsView, sendMessage, setParamsView, visualizerConnector]);

  return (
    <div className="w-fit">
      <Dropdown
        selectedClassName="flex items-center my-[5px] mr-2 px-1.5 py-1 small text-primary rounded bg-layer-4 cursor-pointer"
        selectedValue={items.find((item) => item.id === paramsView)}
        prefix={`${t(CompareI18nKey.View)}: `}
        listClassName={'w-[175px]'}
      >
        {items.map((item, i) => (
          <DropdownMenuItem className="gap-0" key={i} dropdownItem={item} onClick={() => onChange(item.id)} />
        ))}
      </Dropdown>
      {createPortal(
        <DialConfirmationPopup
          open={isModalOpen}
          title={t(EntitiesI18nKey.SaveParametersTitle)}
          description={t(EntitiesI18nKey.SaveParametersDescription)}
          confirmLabel={t(ButtonsI18nKey.Save)}
          cancelLabel={t(ButtonsI18nKey.LeaveWithoutSave)}
          onConfirm={onConfirm}
          onCancel={onCancel}
          onClose={() => setIsModalOpen(false)}
        />,
        document.body,
      )}
    </div>
  );
};

export default ViewControl;
