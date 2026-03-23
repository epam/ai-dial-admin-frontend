import { FC } from 'react';

import LimitsControl from '@/src/components/EntityMainProperties/Limits/Limits';
import { RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';

interface Props {
  entity: EntityRoleLimits;
  onChangeEntity: (entity: EntityRoleLimits, withRefresh?: boolean) => void;
  disabled?: boolean;
}

const RolesDefaults: FC<Props> = ({ entity, onChangeEntity, disabled }) => {
  const t = useI18n();

  return (
    <div className="flex flex-col">
      <h1 className="mb-4">{t(RolesI18nKey.DefaultLimits)}</h1>
      <LimitsControl
        limits={entity.defaultRoleLimit}
        onChangeLimits={(defaultRoleLimit) => onChangeEntity({ ...entity, defaultRoleLimit })}
        disabled={disabled}
      />
    </div>
  );
};

export default RolesDefaults;
