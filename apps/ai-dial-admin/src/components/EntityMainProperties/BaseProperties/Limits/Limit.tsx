import { FC, useCallback } from 'react';

import { NumberInputField } from '@/src/components/Common/InputField/InputField';
import { RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialRoleLimits } from '@/src/models/dial/role-limits';
import PriceControl from '../Price';
import { NO_LIMITS_VALUE } from '@/src/components/EntityView/Roles/constants';

interface Props {
  elementId: string;
  fieldKey: keyof DialRoleLimits;
  fieldTitle: string;
  limits?: DialRoleLimits;
  isCostInputs?: boolean;
  onChange: (limits: DialRoleLimits) => void;
}

const LimitControl: FC<Props> = ({ limits, isCostInputs, onChange, fieldKey, ...props }) => {
  const t = useI18n();

  const onChangeLimit = useCallback(
    (value: number | string, key: keyof DialRoleLimits) => {
      onChange({ ...limits, [key]: value });
    },
    [limits, onChange],
  );

  return isCostInputs ? (
    <PriceControl
      placeholder={t(RolesI18nKey.NoLimits)}
      value={limits?.[fieldKey] === NO_LIMITS_VALUE ? '' : (limits?.[fieldKey] as string | null)}
      onChange={(value) => onChangeLimit(value, fieldKey)}
      {...props}
    />
  ) : (
    <NumberInputField
      placeholder={t(RolesI18nKey.NoLimits)}
      value={limits?.[fieldKey]}
      onChange={(value) => onChangeLimit(value, fieldKey)}
      {...props}
    />
  );
};

export default LimitControl;
