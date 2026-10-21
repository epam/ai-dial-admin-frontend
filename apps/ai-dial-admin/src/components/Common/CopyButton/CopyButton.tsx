import {
  Button,
  ButtonAppearance,
  ButtonVariant,
  DialIconButton,
  DialNeutralButton,
  ElementSize,
} from '@epam/ai-dial-ui-kit';
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
  /** Draws the labelled button with the 2.0 button instead of the 1.0 one. Off by default; a page opts in with its own migration. */
  isDesignSystem2?: boolean;
}

const CopyButton: FC<Props> = ({
  buttonLabel,
  value,
  valueLabel,
  className,
  size = ElementSize.Standard,
  isDesignSystem2,
}) => {
  const { showNotification } = useNotification();
  const t = useI18n();

  // Several copy controls can sit in one view (a panel of snippets, a header of ids), and a bare
  // "copy" leaves them indistinguishable to a screen reader. `valueLabel` already names the value for
  // the confirmation toast, so it is the name to reuse rather than a second prop to thread.
  const copyLabel = valueLabel ? `copy ${valueLabel}` : 'copy';

  const onClick = useCallback(() => {
    if (valueLabel && value) {
      navigator.clipboard.writeText(value);
      const customTitle = (
        <p className="dial-small-semi-text">{`${valueLabel} ${t(BasicI18nKey.CopiedSuccessfully)}`}</p>
      );
      showNotification(getCopyToClipboardNotification(customTitle));
    }
  }, [value, valueLabel, showNotification, t]);

  if (buttonLabel && isDesignSystem2) {
    return (
      <Button
        variant={ButtonVariant.Neutral}
        appearance={ButtonAppearance.Outlined}
        label={buttonLabel}
        iconBefore={<IconCopy size={16} aria-hidden />}
        onClick={onClick}
      />
    );
  }

  return buttonLabel ? (
    <DialNeutralButton
      label={buttonLabel}
      onClick={onClick}
      aria-label={copyLabel}
      iconBefore={<IconCopy stroke={2} size={size === ElementSize.Small ? 16 : 20} />}
      size={size}
    />
  ) : (
    <DialIconButton
      className={classNames('cursor-pointer h-[20px] w-[20px] text-secondary hover:text-accent-primary', className)}
      aria-label={copyLabel}
      size={size}
      onClick={onClick}
      icon={<IconCopy stroke={2} size={size === ElementSize.Small ? 16 : 20} />}
    />
  );
};

export default CopyButton;
