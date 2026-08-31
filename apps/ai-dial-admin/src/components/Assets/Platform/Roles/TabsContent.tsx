'use client';

import { FC } from 'react';

import { DialRoleResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import RoleAssetProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedRole: DialRoleResource;
  isSkipRefresh: boolean;
  onChange: (role: DialRoleResource, skipRefresh?: boolean) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedRole, isSkipRefresh, onChange }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <RoleAssetProperties asset={selectedRole} isSkipRefresh={isSkipRefresh} onChange={onChange} />
      )}
    </>
  );
};

export default TabsContent;
