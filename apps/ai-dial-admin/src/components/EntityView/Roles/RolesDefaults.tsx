import { FC, useCallback } from 'react';

import { NumberInputField } from '@/src/components/Common/InputField/InputField';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialRoleShare } from '@/src/models/dial/role-limits';
import LimitsControl from '@/src/components/EntityMainProperties/Limits/Limits';

interface Props {
  entity: EntityRoleLimits;
  onChangeEntity: (entity: EntityRoleLimits, withRefresh?: boolean) => void;
}

const RolesDefaults: FC<Props> = ({ entity, onChangeEntity }) => {
  const t = useI18n();

  const onChangeDefaultRoleShareResourceLimit = useCallback(
    (value: number | string, key: keyof DialRoleShare) => {
      onChangeEntity({
        ...entity,
        defaultRoleShareResourceLimit: { ...entity.defaultRoleShareResourceLimit, [key]: value },
      });
    },
    [entity, onChangeEntity],
  );

  return (
    <div className="flex flex-row gap-6 mb-8">
      <div className="flex flex-col p-4 bg-layer-3">
        <div className="mb-4 small">{t(RolesI18nKey.DefaultLimits)}</div>
        <LimitsControl
          limits={entity.defaultRoleLimit}
          onChangeLimits={(defaultRoleLimit) => onChangeEntity({ ...entity, defaultRoleLimit })}
        />
      </div>
      <div className="flex flex-col p-4 bg-layer-3">
        <div className="mb-4 small">{t(RolesI18nKey.DefaultInvitations)}</div>
        <div className="flex flex-row gap-x-3">
          <NumberInputField
            elementId="invitationTtl"
            value={entity.defaultRoleShareResourceLimit?.invitationTtl}
            placeholder={t(RolesI18nKey.NoLimits)}
            fieldTitle={t(EntityFieldsI18nKey.invitationTtl)}
            onChange={(value) => onChangeDefaultRoleShareResourceLimit(value, 'invitationTtl')}
            iconAfterInput={<span className="small text-secondary">{t(EntityPlaceholdersI18nKey.Hour)}</span>}
          />
          <NumberInputField
            elementId="maxAcceptedUsers"
            placeholder={t(RolesI18nKey.NoLimits)}
            value={entity.defaultRoleShareResourceLimit?.maxAcceptedUsers}
            fieldTitle={t(EntityFieldsI18nKey.maxAcceptedUsers)}
            onChange={(value) => onChangeDefaultRoleShareResourceLimit(value, 'maxAcceptedUsers')}
          />
        </div>
      </div>
    </div>
  );
};

export default RolesDefaults;
