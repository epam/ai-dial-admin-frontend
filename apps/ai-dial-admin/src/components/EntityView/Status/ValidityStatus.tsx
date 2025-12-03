import { FC } from 'react';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';
import classNames from 'classnames';

import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useTheme } from '@/src/context/ThemeContext';
import { useI18n } from '@/src/locales/client';
import { ValidityState } from '@/src/models/dial/base-entity';
import { getColorClassName, getValidityStatus } from './utils';

interface Props {
  validityState?: ValidityState;
  isHideHint?: boolean;
}

const ValidityStatus: FC<Props> = ({ validityState, isHideHint }) => {
  const t = useI18n();
  const { currentTheme } = useTheme();
  const { title, status } = getValidityStatus(validityState, t);

  const colorClassName = classNames('w-[10px] h-[10px] rounded-full', getColorClassName(status, currentTheme));

  return (
    <div className="flex items-center gap-x-2">
      <div className={colorClassName}></div>
      <div>{title}</div>
      {!isHideHint && !validityState?.valid && (
        <DialTooltip tooltip={validityState?.message || ''}>
          <IconInfoCircle {...BASE_ICON_PROPS} />
        </DialTooltip>
      )}
    </div>
  );
};

export default ValidityStatus;
