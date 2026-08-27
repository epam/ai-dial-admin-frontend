'use client';

import { FC } from 'react';

import { DialRole } from '@/src/models/dial/role';
import { DialKeyResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import KeyRoles from './KeyRoles';
import KeyAssetProperties from './Properties';

interface Props {
  activeTab: EntityViewTab;
  selectedKey: DialKeyResource;
  originalKey: DialKeyResource;
  roles: DialRole[];
  onChange: (key: DialKeyResource) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedKey, originalKey, roles, onChange }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <KeyAssetProperties asset={selectedKey} originalAsset={originalKey} onChange={onChange} />
      )}

      {activeTab === EntityViewTab.Roles && <KeyRoles asset={selectedKey} roles={roles} onChange={onChange} />}
    </>
  );
};

export default TabsContent;
