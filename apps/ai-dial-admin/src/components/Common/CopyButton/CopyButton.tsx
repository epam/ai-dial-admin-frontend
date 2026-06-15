import { DialIconButton, DialNeutralButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconCopy } from '@tabler/icons-react';
import { FC, useCallback } from 'react';

import { BasicI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { getCopyToClipboardNotification } from '@/src/utils/notification';
import classNames from 'classnames';

interface Props {
  buttonLabel?: string;
  valueLabel?: string;
  className?: string;
  value?: string;
  size?: ElementSize;
}

const CopyButton: FC<Props> = ({ buttonLabel, value, valueLabel, className, size = ElementSize.Standard }) => {
  const { showNotification } = useNotification();
  const t = useI18n();

  const onClick = useCallback(() => {
    if (valueLabel && value) {
      navigator.clipboard.writeText(value);
      showNotification(getCopyToClipboardNotification(`${valueLabel} ${t(BasicI18nKey.CopiedSuccessfully)}`));
    }
  }, [value, valueLabel, showNotification, t]);

  return buttonLabel ? (
    <DialNeutralButton
      label={buttonLabel}
      onClick={onClick}
      aria-label="copy"
      iconBefore={<IconCopy stroke={2} size={size === ElementSize.Small ? 16 : 20} />}
      size={size}
    />
  ) : (
    <DialIconButton
      className={classNames('cursor-pointer h-[20px] w-[20px] text-secondary hover:text-accent-primary', className)}
      aria-label="copy"
      size={size}
      onClick={onClick}
      icon={<IconCopy stroke={2} size={size === ElementSize.Small ? 16 : 20} />}
    />
  );
};

export default CopyButton;
