'use client';

import { FC, useEffect, useState } from 'react';
import { DialNumberInput, DialSwitch } from '@epam/ai-dial-ui-kit';
import { IconCurrencyDollar } from '@tabler/icons-react';

import { RolesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { DialRoleResource } from '@/src/models/dial/resource';
import { DialCoreRoleLimits } from '@/src/models/dial/role-limits';

interface Props {
  selectedRole: DialRoleResource;
  onChangeRole: (role: DialRoleResource) => void;
}

const TOKENS: { key: keyof DialCoreRoleLimits; label: RolesI18nKey }[] = [
  { key: 'minute', label: RolesI18nKey.PerMinute },
  { key: 'day', label: RolesI18nKey.PerDay },
  { key: 'week', label: RolesI18nKey.PerWeek },
  { key: 'month', label: RolesI18nKey.PerMonth },
];

/**
 * Adapted from `Entities > Roles`' `RoleCostLimit` (`components/Roles/View/Properties/CostLimits.tsx`).
 * Core's `CostLimit` class is the same `minute`/`day`/`week`/`month` shape either way, but this
 * surface keeps every token a plain number (`DialCoreRoleLimits`) rather than the admin-backend's
 * string-typed `DialRoleLimits`, and represents "unlimited" as the token being **absent** rather
 * than explicitly set to a sentinel value — see `utils/roles/limits.ts`'s doc comment for why: Core
 * defaults a missing token to `Long.MAX_VALUE` itself, so there's no need to round-trip that exact
 * (JS-unsafe) value at all. Any key present in `costLimit` is therefore already a real, finite
 * value, which is also why this doesn't reuse the entity-side `LimitsControl`/`LimitControl` — both
 * are built around `DialRoleLimits`'s string fields (`Big.js` precision handling included) for a
 * concern this surface doesn't have.
 */
const RoleCostLimit: FC<Props> = ({ selectedRole, onChangeRole }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const [costLimitExist, setCostLimitExist] = useState<boolean>(false);

  useEffect(() => {
    setCostLimitExist(Object.keys(selectedRole.costLimit || {}).length > 0);
  }, [selectedRole.costLimit]);

  const toggleCostLimit = (value: boolean) => {
    setCostLimitExist(value);
    if (!value) {
      onChangeRole({ ...selectedRole, costLimit: {} });
    }
  };

  const onChangeToken = (key: keyof DialCoreRoleLimits, value?: number | string) => {
    const numericValue = value === undefined || value === '' ? undefined : Number(value);
    const costLimit = { ...selectedRole.costLimit, [key]: numericValue };
    if (numericValue === undefined) {
      delete costLimit[key];
    }
    onChangeRole({ ...selectedRole, costLimit });
  };

  return (
    <div className="w-full">
      <DialSwitch
        switchId="costLimit"
        label={t(RolesI18nKey.SetCostLimits)}
        isOn={costLimitExist}
        onChange={toggleCostLimit}
        disabled={isReadOnlyAdmin}
      />
      {costLimitExist && (
        <div className="mt-3 pl-[46px] flex flex-row gap-x-3">
          {TOKENS.map(({ key, label }) => (
            <DialNumberInput
              key={key}
              id={key}
              containerClassName="w-[240px]"
              placeholder={t(RolesI18nKey.NoLimits)}
              labelProps={{ label: t(label) }}
              iconBefore={<IconCurrencyDollar className="text-secondary" {...BASE_BUTTON_ICON_PROPS} />}
              value={selectedRole.costLimit?.[key]}
              disabled={isReadOnlyAdmin}
              onChange={(value) => onChangeToken(key, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RoleCostLimit;
