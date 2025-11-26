'use client';

import { FC } from 'react';

import EntityProperties from '@/src/components/EntityMainProperties/Properties/EntityProperties';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import { DialRole } from '@/src/models/dial/role';
import RoleCostLimit from './CostLimits';
import RoleSharing from './Sharing';

interface Props {
  selectedRole: DialRole;
  names: string[];
  isSkipRefresh: boolean;
  onChangeRole: (role: DialRole) => void;
}

const RoleProperties: FC<Props> = ({ selectedRole, names, isSkipRefresh, onChangeRole }) => {
  return (
    <div className="w-full flex flex-col gap-y-8">
      <div className="w-full">
        <EntityHeader entity={selectedRole} />
        <div className="flex-1 min-h-0 pt-8 lg:w-[35%] w-full">
          <EntityProperties
            entity={selectedRole}
            onChangeEntity={onChangeRole}
            names={names}
            isEntityImmutable={true}
          />
        </div>
      </div>
      <RoleCostLimit selectedRole={selectedRole} onChangeRole={onChangeRole} />
      <RoleSharing selectedRole={selectedRole} onChangeRole={onChangeRole} isSkipRefresh={isSkipRefresh} />
    </div>
  );
};

export default RoleProperties;
