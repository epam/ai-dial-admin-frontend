'use client';

import { FC } from 'react';

import EntityInfoHeader from '@/src/components/EntityHeaderControls/Info/InfoHeader';
import { DialRole } from '@/src/models/dial/role';
import RoleProperties from './Properties';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  selectedRole: DialRole;
  names: string[];
  isSkipRefresh: boolean;
  onChange: (role: DialRole) => void;
}

const PropertiesTabContent: FC<Props> = ({ isSkipRefresh, names, onChange, selectedRole }) => {
  return (
    <div className="h-full flex flex-col w-full">
      <EntityInfoHeader id={selectedRole.name} entity={selectedRole} view={ApplicationRoute.Roles} />
      <div className="flex-1 min-h-0 pt-8">
        <RoleProperties
          selectedRole={selectedRole}
          names={names}
          onChangeRole={onChange}
          isSkipRefresh={isSkipRefresh}
        />
      </div>
    </div>
  );
};

export default PropertiesTabContent;
