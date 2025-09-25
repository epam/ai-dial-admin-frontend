'use client';

import { FC, useEffect, useState } from 'react';

import Switch from '@/src/components/Common/Switch/Switch';
import { NO_LIMITS_VALUE } from '@/src/components/EntityView/Roles/constants';
import { RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import LimitsControl from '@/src/components/EntityMainProperties/BaseProperties/Limits/Limits';

interface Props {
  selectedRole: DialRole;
  onChangeRole: (role: DialRole) => void;
}

const RoleCostLimit: FC<Props> = ({ selectedRole, onChangeRole }) => {
  const t = useI18n() as (key: string) => string;
  const [costLimitExist, setCostLimitExist] = useState<boolean>(false);

  useEffect(() => {
    setCostLimitExist(
      Object.keys(selectedRole.costLimit || {}).some(
        (key) => (selectedRole.costLimit as Record<string, unknown>)[key] !== NO_LIMITS_VALUE,
      ),
    );
  }, [selectedRole.costLimit]);

  const toggleCostLimit = (value: boolean) => {
    setCostLimitExist(value);
    if (!value) {
      onChangeRole({
        ...selectedRole,
        costLimit: {
          minute: NO_LIMITS_VALUE,
          day: NO_LIMITS_VALUE,
          week: NO_LIMITS_VALUE,
          month: NO_LIMITS_VALUE,
        },
      });
    }
  };

  return (
    <div className="w-full mt-6">
      <Switch
        switchId="costLimit"
        title={t(RolesI18nKey.SetCostLimits)}
        isOn={costLimitExist}
        onChange={toggleCostLimit}
      />
      {costLimitExist && (
        <div className="flex flex-row gap-x-6 mt-3 pl-[46px]">
          <LimitsControl
            controlClassName="lg:w-[240px] w-full"
            limits={selectedRole.costLimit}
            isCostInputs={true}
            onChangeLimits={(costLimit) => onChangeRole({ ...selectedRole, costLimit })}
          />
        </div>
      )}
    </div>
  );
};

export default RoleCostLimit;
