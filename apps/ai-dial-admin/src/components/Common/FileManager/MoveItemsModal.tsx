'use client';

import { FC } from 'react';

import { ButtonAppearance, DialPopup, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import MoveToIcon from '@/public/images/icons/move-to.svg';

import { useI18n } from '@/src/locales/client';
import { ButtonsI18nKey, FileManagerI18nKey } from '@/src/constants/i18n';
import { MOVE_ITEMS_INDICATOR_SIZE, MOVE_ITEMS_INDICATOR_WIDTH } from './constants';

interface Props {
  totalItems: number;
  movedItems: number;
  isModalOpen: boolean;
  onCancel: () => void;
}

const MoveItemsModal: FC<Props> = ({ isModalOpen, totalItems, movedItems, onCancel }) => {
  const t = useI18n();

  const progress = totalItems === 0 ? 0 : movedItems / totalItems;
  const radius = (MOVE_ITEMS_INDICATOR_SIZE - MOVE_ITEMS_INDICATOR_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

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
        <svg
          width={MOVE_ITEMS_INDICATOR_SIZE}
          height={MOVE_ITEMS_INDICATOR_SIZE}
          style={{ display: 'block', margin: '0 auto' }}
        >
          <circle
            className="stroke-secondary"
            cx={MOVE_ITEMS_INDICATOR_SIZE / 2}
            cy={MOVE_ITEMS_INDICATOR_SIZE / 2}
            r={radius}
            strokeWidth={MOVE_ITEMS_INDICATOR_WIDTH}
            fill="none"
          />
          <circle
            className="stroke-info"
            cx={MOVE_ITEMS_INDICATOR_SIZE / 2}
            cy={MOVE_ITEMS_INDICATOR_SIZE / 2}
            r={radius}
            strokeWidth={MOVE_ITEMS_INDICATOR_WIDTH}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <g
            transform={`translate(${MOVE_ITEMS_INDICATOR_SIZE / 2 - 18}, ${MOVE_ITEMS_INDICATOR_SIZE / 2 - 18}) scale(2)`}
          >
            <MoveToIcon />
          </g>
        </svg>

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
