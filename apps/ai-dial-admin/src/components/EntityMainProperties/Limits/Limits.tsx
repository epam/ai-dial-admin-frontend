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
}

const LimitsControl: FC<Props> = ({ limits, onChangeLimits, ...props }) => {
  const t = useI18n();

  return (
    <div className="flex flex-row gap-x-3">
      <LimitControl
        elementId="minute"
        fieldKey="minute"
        limits={limits}
        fieldTitle={t(RolesI18nKey.PerMinute)}
        onChange={onChangeLimits}
        {...props}
      />

      <LimitControl
        elementId="day"
        fieldKey="day"
        limits={limits}
        fieldTitle={t(RolesI18nKey.PerDay)}
        onChange={onChangeLimits}
        {...props}
      />

      <LimitControl
        elementId="week"
        fieldKey="week"
        limits={limits}
        fieldTitle={t(RolesI18nKey.PerWeek)}
        onChange={onChangeLimits}
        {...props}
      />

      <LimitControl
        elementId="month"
        fieldKey="month"
        limits={limits}
        fieldTitle={t(RolesI18nKey.PerMonth)}
        onChange={onChangeLimits}
        {...props}
      />
    </div>
  );
};

export default LimitsControl;
