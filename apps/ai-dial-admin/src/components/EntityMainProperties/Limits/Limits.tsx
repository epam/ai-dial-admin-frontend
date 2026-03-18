import { FC } from 'react';

import { RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialRoleLimits } from '@/src/models/dial/role-limits';
import LimitControl from './Limit';

interface Props {
  controlClassName?: string;
  limits?: DialRoleLimits;
  isCostInputs?: boolean;
  onChangeLimits: (limits: DialRoleLimits) => void;
  disabled?: boolean;
}

const LimitsControl: FC<Props> = ({ limits, onChangeLimits, disabled, ...props }) => {
  const t = useI18n();

  return (
    <div className="flex flex-row gap-x-3">
      <LimitControl
        id="minute"
        fieldKey="minute"
        limits={limits}
        label={t(RolesI18nKey.PerMinute)}
        onChange={onChangeLimits}
        disabled={disabled}
        {...props}
      />

      <LimitControl
        id="day"
        fieldKey="day"
        limits={limits}
        label={t(RolesI18nKey.PerDay)}
        onChange={onChangeLimits}
        disabled={disabled}
        {...props}
      />

      <LimitControl
        id="week"
        fieldKey="week"
        limits={limits}
        label={t(RolesI18nKey.PerWeek)}
        onChange={onChangeLimits}
        disabled={disabled}
        {...props}
      />

      <LimitControl
        id="month"
        fieldKey="month"
        limits={limits}
        label={t(RolesI18nKey.PerMonth)}
        onChange={onChangeLimits}
        disabled={disabled}
        {...props}
      />
    </div>
  );
};

export default LimitsControl;
