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
  buttonLabel?: string;
  valueLabel?: string;
  className?: string;
  value?: string;
}

const CopyButton: FC<Props> = ({ buttonLabel, value, valueLabel, className }) => {
  const { showNotification } = useNotification();
  const t = useI18n();

  const onClick = useCallback(() => {
    if (valueLabel && value) {
      navigator.clipboard.writeText(value);
      showNotification(getSuccessNotification(`${valueLabel} ${t(BasicI18nKey.CopiedSuccessfully)}`));
    }
  }, [value, valueLabel, showNotification, t]);

  return buttonLabel ? (
    <DialNeutralButton
      label={buttonLabel}
      onClick={onClick}
      aria-label="copy"
      iconBefore={<IconCopy {...BASE_BUTTON_ICON_PROPS} />}
    />
  ) : (
    <DialIconButton
      className={classNames('cursor-pointer text-secondary hover:text-accent-primary', className)}
      aria-label="copy"
      onClick={onClick}
      icon={<IconCopy {...BASE_BUTTON_ICON_PROPS} />}
    />
  );
};

export default CopyButton;
