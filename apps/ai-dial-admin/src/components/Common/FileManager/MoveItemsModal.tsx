'use client';

import { FC } from 'react';

import { ButtonAppearance, DialPopup, DialPrimaryButton } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { MOVE_ITEMS_INDICATOR_SIZE, MOVE_ITEMS_INDICATOR_WIDTH } from './constants';
import ProgressBar from '@/src/components/Common/ProgressBar/ProgressBar';

interface Props {
  totalItems: number;
  movedItems: number;
  isModalOpen: boolean;
  onCancel: () => void;
}

const MoveItemsModal: FC<Props> = ({ isModalOpen, totalItems, movedItems, onCancel }) => {
  const t = useI18n();

  return (
    <DialPopup
      open={isModalOpen}
      className="w-[280px]"
      header={undefined}
      footer={undefined}
      dividers={false}
      headerClassName={'hidden'}
      hideClose
    >
      <div className="flex items-center flex-col gap-6 p-9">
        <ProgressBar
          totalItems={totalItems}
          processedItems={movedItems}
          size={MOVE_ITEMS_INDICATOR_SIZE}
          indicatorWidth={MOVE_ITEMS_INDICATOR_WIDTH}
        />

        <div className="flex flex-col gap-2 text-center text-primary">
          <div className="text-lg font-semibold">{t(FileManagerI18nKey.MovingItems)}</div>
          <div className="text-sm">
            {t(FileManagerI18nKey.MovingProgress, { count: movedItems, total: totalItems })}
          </div>
        </div>
        <DialPrimaryButton
          className="w-fit"
          appearance={ButtonAppearance.Ghost}
          label={t(ButtonsI18nKey.Cancel)}
          onClick={() => onCancel()}
        />
      </div>
    </DialPopup>
  );
};

export default MoveItemsModal;
