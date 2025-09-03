import { FC, useCallback } from 'react';

import { NumberInputField } from '@/src/components/Common/InputField/InputField';
import { EntityFieldsI18nKey, RolesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { EntityRoleLimits } from '@/src/models/dial/base-entity';
import { DialRoleLimits, DialRoleShare } from '@/src/models/dial/role-limits';

interface Props {
  entity: EntityRoleLimits;
  onChangeEntity: (entity: EntityRoleLimits, withRefresh?: boolean) => void;
}

const RolesDefaults: FC<Props> = ({ entity, onChangeEntity }) => {
  const t = useI18n();

  const onChangeDefaultLimit = useCallback(
    (value: number | string, key: keyof DialRoleLimits) => {
      onChangeEntity({
        ...entity,
        defaultRoleLimit: { ...entity.defaultRoleLimit, [key]: value },
      });
    },
    [entity, onChangeEntity],
  );

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
        <div className="flex flex-row gap-x-3">
          <NumberInputField
            elementId="minute"
            value={entity.defaultRoleLimit?.minute}
            placeholder={t(RolesI18nKey.NoLimits)}
            fieldTitle={t(EntityFieldsI18nKey.minute)}
            onChange={(value) => onChangeDefaultLimit(value, 'minute')}
          />
          <NumberInputField
            elementId="day"
            placeholder={t(RolesI18nKey.NoLimits)}
            value={entity.defaultRoleLimit?.day}
            fieldTitle={t(EntityFieldsI18nKey.day)}
            onChange={(value) => onChangeDefaultLimit(value, 'day')}
          />
          <NumberInputField
            elementId="week"
            placeholder={t(RolesI18nKey.NoLimits)}
            value={entity.defaultRoleLimit?.week}
            fieldTitle={t(EntityFieldsI18nKey.week)}
            onChange={(value) => onChangeDefaultLimit(value, 'week')}
          />
          <NumberInputField
            elementId="month"
            placeholder={t(RolesI18nKey.NoLimits)}
            value={entity.defaultRoleLimit?.month}
            fieldTitle={t(EntityFieldsI18nKey.month)}
            onChange={(value) => onChangeDefaultLimit(value, 'month')}
          />
        </div>
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
