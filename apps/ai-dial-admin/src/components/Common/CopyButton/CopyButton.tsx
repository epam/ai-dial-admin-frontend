import { DialIconButton, DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconCopy } from '@tabler/icons-react';
import { FC, useCallback } from 'react';

import { BasicI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getSuccessNotification } from '@/src/utils/notification';
import classNames from 'classnames';

interface Props {
  label?: string;
  className?: string;
  field?: string;
  isFullButton?: boolean;
}

const CopyButton: FC<Props> = ({ label, field, className, isFullButton = false }) => {
  const { showNotification } = useNotification();
  const t = useI18n();

  const onClick = useCallback(() => {
    if (field) {
      navigator.clipboard.writeText(field);
      showNotification(getSuccessNotification(`${label} ${t(BasicI18nKey.CopiedSuccessfully)}`));
    }
  }, [field, label, showNotification, t]);

  return isFullButton ? (
    <DialNeutralButton onClick={onClick} aria-label="copy" iconBefore={<IconCopy {...BASE_BUTTON_ICON_PROPS} />} />
  ) : (
    <DialIconButton
      className={classNames('cursor-pointer text-secondary hover:text-accent-primary p-0 h-[20px] w-[20px]', className)}
      tooltipProps={{ triggerClassName: 'h-[20px] w-[20px]' }}
      aria-label="copy"
      onClick={onClick}
      icon={<IconCopy {...BASE_BUTTON_ICON_PROPS} />}
    />
  );
};

export default CopyButton;
