'use client';

import { FC } from 'react';

import AssetRoles from '@/src/components/EntityView/Roles/AssetRoles';
import { DialAliasResource } from '@/src/models/dial/alias';
import { ConfigHealthSkippedEntity } from '@/src/models/dial/config-health';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import InvalidAliasBanner from './InvalidAliasBanner';
import AliasProperties from './Properties';
import AliasTargetTab from './Target';

interface Props {
  activeTab: EntityViewTab;
  selectedAlias: DialAliasResource;
  roles: DialRole[];
  healthIssue?: ConfigHealthSkippedEntity;
  onChange: (alias: DialAliasResource) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedAlias, roles, healthIssue, onChange }) => (
  <>
    {activeTab === EntityViewTab.Properties && (
      <AliasProperties asset={selectedAlias} healthIssue={healthIssue} onChange={onChange} />
    )}

    {activeTab === EntityViewTab.Target && (
      <div className="flex flex-col gap-y-8">
        <InvalidAliasBanner entity={selectedAlias} issue={healthIssue} />
        <AliasTargetTab asset={selectedAlias} onChange={onChange} />
      </div>
    )}

    {activeTab === EntityViewTab.Roles && (
      <AssetRoles view={ApplicationRoute.AssetsAliases} asset={selectedAlias} roles={roles} onChange={onChange} />
    )}
  </>
);

export default TabsContent;
