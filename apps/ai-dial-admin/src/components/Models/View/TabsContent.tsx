'use client';
import { FC } from 'react';

import EntityAudit from '@/src/components/EntityTabs/Audit/EntityAudit';
import EntityFeatures from '@/src/components/EntityTabs/Features/Features';
import EntityInterceptors from '@/src/components/EntityView/Interceptors/Interceptors';
import EntityRoles from '@/src/components/EntityView/Roles/Roles';
import PropertiesContent from '@/src/components/EntityView/View/Content/PropertiesContent';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { DialModel } from '@/src/models/dial/model';
import { DialRole } from '@/src/models/dial/role';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import PropertiesTabContent from '../../EntityTabs/PropertiesTabContent';
import ModelProperties from '../../ModelView/ModelProperties/ModelProperties';

interface Props {
  activeTab: EntityViewTab;
  names: string[];
  selectedModel: DialModel;
  interceptors?: DialInterceptor[] | null;
  roles?: DialRole[] | null;
  isSkipRefresh: boolean;
  onChange: (selectedModel: DialModel, isSkipRefresh?: boolean) => void;
}

const TabsContent: FC<Props> = ({ activeTab, isSkipRefresh, interceptors, roles, selectedModel, onChange, names }) => {
  return (
    <>
      {activeTab === EntityViewTab.Properties && (
        <PropertiesTabContent entity={selectedModel} view={ApplicationRoute.Models} id={selectedModel.name}>
          <ModelProperties model={selectedModel} modelsNames={names} onChangeModel={onChange} />
        </PropertiesTabContent>
      )}
      {activeTab === EntityViewTab.Features && (
        <EntityFeatures entity={selectedModel} onChangeEntity={onChange} view={ApplicationRoute.Models} />
      )}

      {activeTab === EntityViewTab.Roles && (
        <EntityRoles
          entity={selectedModel}
          view={ApplicationRoute.Models}
          roles={roles || []}
          onChangeEntity={onChange}
          isSkipRefresh={isSkipRefresh}
        />
      )}
      {activeTab === EntityViewTab.Interceptors && (
        <EntityInterceptors
          entity={selectedModel}
          interceptors={interceptors || []}
          onChangeEntity={onChange}
          view={ApplicationRoute.Models}
        />
      )}
      {activeTab === EntityViewTab.Audit && <EntityAudit entity={selectedModel} view={ApplicationRoute.Models} />}
    </>
  );
};

export default TabsContent;
