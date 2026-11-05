'use client';

import { FC } from 'react';

import PolicyAssignmentAssetProperties from '@/src/components/Assets/Platform/PolicyAssignments/Properties';
import SubjectRulesEditor from '@/src/components/Assets/Platform/PolicySubjects/SubjectRulesEditor';
import { DialPolicyAssignmentResource } from '@/src/models/dial/resource';
import { EntityViewTab } from '@/src/utils/tabs/utils';

interface Props {
  activeTab: EntityViewTab;
  selectedAssignment: DialPolicyAssignmentResource;
  onChange: (assignment: DialPolicyAssignmentResource) => void;
}

const TabsContent: FC<Props> = ({ activeTab, selectedAssignment, onChange }) => (
  <>
    {activeTab === EntityViewTab.Properties && (
      <PolicyAssignmentAssetProperties asset={selectedAssignment} onChange={onChange} />
    )}

    {activeTab === EntityViewTab.Subjects && (
      <SubjectRulesEditor
        rules={selectedAssignment.subject}
        onChange={(subject) => onChange({ ...selectedAssignment, subject })}
      />
    )}
  </>
);

export default TabsContent;
