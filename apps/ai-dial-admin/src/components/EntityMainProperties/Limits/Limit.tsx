import { FC, useCallback } from 'react';
import { IconCurrencyDollar } from '@tabler/icons-react';
import { DialNumberInputField } from '@epam/ai-dial-ui-kit';

import { RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialRoleLimits } from '@/src/models/dial/role-limits';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { NO_LIMITS_VALUE } from '@/src/components/EntityView/Roles/constants';

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
    (value: number | string, key: keyof DialRoleLimits) => {
      onChange({ ...limits, [key]: value });
    },
    [limits, onChange],
  );

  return (
    <DialNumberInputField
      containerCssClass={controlClassName}
      placeholder={t(RolesI18nKey.NoLimits)}
      value={limits?.[fieldKey] === NO_LIMITS_VALUE ? '' : (limits?.[fieldKey] as string | null)}
      onChange={(value) => onChangeLimit(value, fieldKey)}
      iconBefore={isCostInputs ? <IconCurrencyDollar className="text-secondary" {...BASE_ICON_PROPS} /> : null}
      {...props}
    />
  );
};

export default LimitControl;
