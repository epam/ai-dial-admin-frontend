'use client';

import { FC, useEffect, useState } from 'react';
import { DialSwitch } from '@epam/ai-dial-ui-kit';

import { UNLIMITED_VALUE } from '@/src/constants/role';
import { RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DialRole } from '@/src/models/dial/role';
import LimitsControl from '@/src/components/EntityMainProperties/Limits/Limits';

interface Props {
  selectedRole: DialRole;
  onChangeRole: (role: DialRole) => void;
}

const RoleCostLimit: FC<Props> = ({ selectedRole, onChangeRole }) => {
  const t = useI18n();
  const [costLimitExist, setCostLimitExist] = useState<boolean>(false);

  useEffect(() => {
    setCostLimitExist(
      Object.keys(selectedRole.costLimit || {}).some(
        (key) => (selectedRole.costLimit as Record<string, unknown>)[key] !== UNLIMITED_VALUE,
      ),
    );
  }, [selectedRole.costLimit]);

  const toggleCostLimit = (value: boolean) => {
    setCostLimitExist(value);
    if (!value) {
      onChangeRole({
        ...selectedRole,
        costLimit: {
          minute: UNLIMITED_VALUE,
          day: UNLIMITED_VALUE,
          week: UNLIMITED_VALUE,
          month: UNLIMITED_VALUE,
        },
      });
    }
  };

  return (
    <div className="w-full">
      <DialSwitch
        switchId="costLimit"
        label={t(RolesI18nKey.SetCostLimits)}
        isOn={costLimitExist}
        onChange={toggleCostLimit}
      />
      {costLimitExist && (
        <div className="mt-3 pl-[46px]">
          <LimitsControl
            limits={selectedRole.costLimit}
            controlClassName="max-w-[240px]"
            isCostInputs={true}
            onChangeLimits={(costLimit) => onChangeRole({ ...selectedRole, costLimit })}
          />
        </div>
      )}
    </div>
  );
};

export default RoleCostLimit;
