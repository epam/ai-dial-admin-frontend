'use client';

import { FC } from 'react';

import PolicyAssetProperties from '@/src/components/Assets/Platform/Policies/Properties';
import SubjectRulesEditor from '@/src/components/Assets/Platform/PolicySubjects/SubjectRulesEditor';
import { DialPolicyResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';

interface Props {
  activeTab: EntityViewTab;
  selectedPolicy: DialPolicyResource;
  onChange: (policy: DialPolicyResource) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedPolicy, onChange }) => (
  <>
    {activeTab === EntityViewTab.Properties && <PolicyAssetProperties asset={selectedPolicy} onChange={onChange} />}

    {activeTab === EntityViewTab.Subjects && (
      <SubjectRulesEditor
        rules={selectedPolicy.subject}
        onChange={(subject) => onChange({ ...selectedPolicy, subject })}
      />
    )}
  </>
);

export default TabsContent;
