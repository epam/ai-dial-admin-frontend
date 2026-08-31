'use client';

import { FC } from 'react';

import ResourceInfoHeader from '@/src/components/Assets/Resources/ResourceInfoHeader';
import { DialRoleResource } from '@/src/models/dial/resource';
import RoleCostLimit from './CostLimits';
import RoleSharing from './Sharing';

interface Props {
  asset: DialRoleResource;
  isSkipRefresh: boolean;
  onChange: (asset: DialRoleResource, skipRefresh?: boolean) => void;
}

const RoleAssetProperties: FC<Props> = ({ asset, isSkipRefresh, onChange }) => {
  return (
    <div className="flex flex-col">
      <ResourceInfoHeader entity={asset} />
      <div className="flex flex-col gap-y-8 mt-8">
        <RoleCostLimit selectedRole={asset} onChangeRole={onChange} />
        <RoleSharing selectedRole={asset} onChangeRole={onChange} isSkipRefresh={isSkipRefresh} />
      </div>
    </div>
  );
};

export default RoleAssetProperties;
