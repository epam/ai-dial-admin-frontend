'use client';

import { FC } from 'react';

import TopicsControl from '@/src/components/BaseControls/Topics';
import EntityProperties from '@/src/components/EntityMainProperties/Properties/EntityProperties';
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
      <EntityProperties entity={selectedRole} onChangeEntity={onChangeRole} names={names} isEntityImmutable={true} />
      <TopicsControl entity={selectedRole} onChange={onChangeRole} />
      <RoleCostLimit selectedRole={selectedRole} onChangeRole={onChangeRole} />
      <RoleSharing selectedRole={selectedRole} onChangeRole={onChangeRole} isSkipRefresh={isSkipRefresh} />
    </div>
  );
};

export default RoleProperties;
