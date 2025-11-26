import { DialNumberInputField } from '@epam/ai-dial-ui-kit';
import { IconCurrencyDollar } from '@tabler/icons-react';
import Big from 'big.js';
import { FC, useCallback } from 'react';

import { RolesI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { UNLIMITED_VALUE } from '@/src/constants/role';
import { useI18n } from '@/src/locales/client';
import { DialRoleLimits } from '@/src/models/dial/role-limits';

interface Props {
  controlClassName?: string;
  elementId: string;
  fieldKey: keyof DialRoleLimits;
  fieldTitle: string;
  limits?: DialRoleLimits;
  isCostInputs?: boolean;
  onChange: (limits: DialRoleLimits) => void;
}

const LimitControl: FC<Props> = ({ limits, controlClassName, isCostInputs, onChange, fieldKey, ...props }) => {
  const t = useI18n();

  const onChangeLimit = useCallback(
    (value: number | string | undefined, key: keyof DialRoleLimits) => {
      onChange({ ...limits, [key]: value });
    },
    [limits, onChange],
  );

  return (
    <DialNumberInputField
      containerCssClass={controlClassName}
      placeholder={t(RolesI18nKey.NotSpecified)}
      value={
        limits?.[fieldKey] === UNLIMITED_VALUE
          ? ''
          : (limits?.[fieldKey] as string)
            ? new Big(limits?.[fieldKey] as string).toFixed()
            : ''
      }
      onChange={(value) => onChangeLimit(value, fieldKey)}
      iconBefore={isCostInputs ? <IconCurrencyDollar className="text-secondary" {...BASE_ICON_PROPS} /> : null}
      {...props}
    />
  );
};

export default LimitControl;
