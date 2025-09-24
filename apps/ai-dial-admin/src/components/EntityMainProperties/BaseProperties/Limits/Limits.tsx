import { FC } from 'react';

import { EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialRoleLimits } from '@/src/models/dial/role-limits';
import LimitControl from './Limit';

interface Props {
  limits?: DialRoleLimits;
  isCostInputs?: boolean;
  onChangeLimits: (limits: DialRoleLimits) => void;
}

const LimitsControl: FC<Props> = ({ limits, isCostInputs, onChangeLimits }) => {
  const t = useI18n();

  return (
    <div className="flex flex-row gap-x-3">
      <LimitControl
        elementId="minute"
        fieldKey="minute"
        limits={limits}
        fieldTitle={t(EntityFieldsI18nKey.minute)}
        isCostInputs={isCostInputs}
        onChange={onChangeLimits}
      />

      <LimitControl
        elementId="day"
        fieldKey="day"
        limits={limits}
        fieldTitle={t(EntityFieldsI18nKey.day)}
        isCostInputs={isCostInputs}
        onChange={onChangeLimits}
      />

      <LimitControl
        elementId="week"
        fieldKey="week"
        limits={limits}
        fieldTitle={t(EntityFieldsI18nKey.week)}
        isCostInputs={isCostInputs}
        onChange={onChangeLimits}
      />

      <LimitControl
        elementId="month"
        fieldKey="month"
        limits={limits}
        fieldTitle={t(EntityFieldsI18nKey.month)}
        isCostInputs={isCostInputs}
        onChange={onChangeLimits}
      />
    </div>
  );
};

export default LimitsControl;
