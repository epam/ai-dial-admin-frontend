import { FC } from 'react';

import { DIAL_ICON_SIZE, DialLoader, Tooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';
import classNames from 'classnames';

import { StatusBadgeI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { STATUS_BADGE_TONES } from './constants';
import { StatusBadgeLeading, StatusBadgeProps } from './models';

const StatusBadge: FC<StatusBadgeProps> = ({
  tone,
  label,
  leading = StatusBadgeLeading.Dot,
  hint,
  trailing,
  className,
}) => {
  const t = useI18n();
  const { backgroundClassName, textClassName } = STATUS_BADGE_TONES[tone];

  return (
    <div className={classNames('inline-flex items-center gap-1', className)}>
      <div
        className={classNames(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-[120px] dial-tiny-semi-text',
          backgroundClassName,
          textClassName,
        )}
      >
        {leading !== StatusBadgeLeading.None && (
          <span className="flex size-3 shrink-0 items-center justify-center" aria-hidden>
            {leading === StatusBadgeLeading.Spinner ? (
              <DialLoader size={12} fullWidth={false} iconClassName={textClassName} />
            ) : (
              <span className="size-[6px] rounded-full bg-[currentColor]" />
            )}
          </span>
        )}
        <span>{label}</span>
      </div>
      {hint && (
        <Tooltip tooltip={hint}>
          <button
            type="button"
            aria-label={t(StatusBadgeI18nKey.Details)}
            className="flex size-6 items-center justify-center rounded text-secondary"
          >
            <IconInfoCircle size={DIAL_ICON_SIZE.SM} aria-hidden />
          </button>
        </Tooltip>
      )}
      {trailing}
    </div>
  );
};

export default StatusBadge;
