import { FC } from 'react';

import { DIAL_ICON_SIZE, DialTooltip } from '@epam/ai-dial-ui-kit';
import { IconInfoCircle } from '@tabler/icons-react';
import classNames from 'classnames';

import { StatusBadgeI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { STATUS_BADGE_VARIANTS } from './constants';
import { StatusBadgeProps } from './models';

const StatusBadge: FC<StatusBadgeProps> = ({ variant, label, hint, className }) => {
  const t = useI18n();
  const { pillClassName } = STATUS_BADGE_VARIANTS[variant];

  return (
    <div className={classNames('inline-flex items-center gap-1 self-start', className)}>
      <div
        className={classNames(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-[120px] dial-tiny-semi-text',
          pillClassName,
        )}
      >
        <span className={'size-[6px] mx-1 shrink-0 rounded-full bg-[currentColor]'} aria-hidden />
        <span>{label}</span>
      </div>
      {hint && (
        <DialTooltip tooltip={hint}>
          <button type="button" aria-label={t(StatusBadgeI18nKey.Details)} className="flex text-secondary">
            <IconInfoCircle size={DIAL_ICON_SIZE.SM} aria-hidden />
          </button>
        </DialTooltip>
      )}
    </div>
  );
};

export default StatusBadge;
