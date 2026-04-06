import { FC, useCallback } from 'react';

import { DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';
import classNames from 'classnames';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useTheme } from '@/src/context/ThemeContext';
import { useI18n } from '@/src/locales/client';
import { getColorClassName, getValidityStatus } from './utils';
import { useNotification } from '@/src/context/NotificationContext';
import { getSuccessNotification } from '@/src/utils/notification';
import { BasicI18nKey } from '@/src/constants/i18n';

interface Props {
  message?: string;
  valid?: boolean;
  isHideHint?: boolean;
  label?: string;
}

const ValidityStatus: FC<Props> = ({ message, valid, isHideHint, label }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const { currentTheme } = useTheme();
  const { title, status } = getValidityStatus(valid, t);

  const colorClassName = classNames('w-[10px] h-[10px] rounded-full', getColorClassName(status, currentTheme));

  const onClick = useCallback(() => {
    if (message) {
      navigator.clipboard.writeText(message);
      showNotification(getSuccessNotification(`${label} ${t(BasicI18nKey.CopiedSuccessfully)}`));
    }
  }, [label, message, showNotification, t]);

  return (
    <div className="flex items-center gap-x-2">
      <div className={colorClassName}></div>
      <div>{title}</div>
      {!isHideHint && !valid && (
        <DialTooltip tooltip={message || ''}>
          <IconInfoCircle {...BASE_BUTTON_ICON_PROPS} onClick={onClick} className="cursor-pointer" />
        </DialTooltip>
      )}
    </div>
  );
};

export default ValidityStatus;
