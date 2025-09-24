'use client';

import { FC } from 'react';

import SimpleEntityProperties from '@/src/components/EntityMainProperties/SimpleEntityProperties';
import EntityHeader from '@/src/components/EntityView/Header/Header';
import { DialRole } from '@/src/models/dial/role';
import RoleCostLimit from './CostLimits';

interface Props {
  selectedRole: DialRole;
  names: string[];
  onChangeRole: (role: DialRole) => void;
}

const RoleProperties: FC<Props> = ({ selectedRole, names, onChangeRole }) => {
  return (
    <div className="w-full mt-3 flex flex-col">
      <div className="lg:w-[35%] mt-3 w-full">
        <EntityHeader entity={selectedRole} />
        <div className="flex-1 min-h-0 pt-4">
          <SimpleEntityProperties
            entity={selectedRole}
            onChangeEntity={onChangeRole}
            names={names}
            isEntityImmutable={true}
          />
        </div>
      </div>
      <RoleCostLimit selectedRole={selectedRole} onChangeRole={onChangeRole} />
    </div>
  );
};

export default RoleProperties;
