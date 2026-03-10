import { FC, useCallback } from 'react';

import { DialNumberInput } from '@epam/ai-dial-ui-kit';
import { IconCurrencyDollar } from '@tabler/icons-react';

import { RolesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialRoleLimits } from '@/src/models/dial/role-limits';
import { getCorrectValue } from './utils';

interface Props {
  controlClassName?: string;
  id: string;
  fieldKey: keyof DialRoleLimits;
  label: string;
  limits?: DialRoleLimits;
  isCostInputs?: boolean;
  onChange: (limits: DialRoleLimits) => void;
}

const LimitControl: FC<Props> = ({ limits, controlClassName, isCostInputs, onChange, fieldKey, label, id }) => {
  const t = useI18n();

  const onChangeLimit = useCallback(
    (value: number | string | undefined, key: keyof DialRoleLimits) => {
      onChange({ ...limits, [key]: value?.toString() });
    },
    [limits, onChange],
  );

  return (
    <DialNumberInput
      containerClassName={controlClassName}
      placeholder={t(RolesI18nKey.NoLimits)}
      value={getCorrectValue(limits?.[fieldKey])}
      onChange={(value) => onChangeLimit(value, fieldKey)}
      iconBefore={isCostInputs ? <IconCurrencyDollar className="text-secondary" {...BASE_BUTTON_ICON_PROPS} /> : null}
      labelProps={{ label }}
      id={id}
    />
  );
};

export default LimitControl;
