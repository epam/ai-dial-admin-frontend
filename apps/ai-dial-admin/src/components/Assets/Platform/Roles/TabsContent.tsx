'use client';

import { FC } from 'react';

import { DialRoleResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import RoleEntities from './Entities';
import { PlatformRoleModelOption } from './models';
import RoleAssetProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedRole: DialRoleResource;
  models: PlatformRoleModelOption[];
  isSkipRefresh: boolean;
  onChange: (role: DialRoleResource, skipRefresh?: boolean) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedRole, models, isSkipRefresh, onChange }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <RoleAssetProperties asset={selectedRole} isSkipRefresh={isSkipRefresh} onChange={onChange} />
      )}
      {activeTab === EntityViewTab.Entities && (
        <RoleEntities
          selectedRole={selectedRole}
          models={models}
          isSkipRefresh={isSkipRefresh}
          onChangeRole={onChange}
        />
      )}
    </>
  );
};

export default TabsContent;
