'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removePolicyAssignment, updatePolicyAssignment } from '@/src/app/[lang]/platform-policy-assignments/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ENTITY_VIEW_CLASS_NAME, ENTITY_VIEW_SCROLL_CLASS_NAME } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { usePolicyAssignmentsFolder } from '@/src/context/assets/PolicyAssignmentsFolderContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialPolicyAssignmentResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { areRulesValid } from '@/src/utils/policies/subjects';
import { getExpiresAtError } from '@/src/utils/policies/validation';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalAssignment: DialPolicyAssignmentResource;
}

const PolicyAssignmentAssetView: FC<Props> = ({ etag, originalAssignment }) => {
  const t = useI18n();
  const router = useRouter();
  const { fetchFiles } = usePolicyAssignmentsFolder();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedAssignment, setSelectedAssignment] = useState(structuredClone(originalAssignment));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
      // An assignment has no admin-backend projection, so there is no format to choose between.
      onHideFormatSelector: () => true,
    }),
    [isEditorEnabled],
  );

  const tabs = useMemo(() => getTabsForAsset(t, ApplicationRoute.PlatformPolicyAssignments), [t]);

  useEffect(() => {
    setSelectedAssignment(structuredClone(originalAssignment));
  }, [originalAssignment]);

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(originalAssignment, selectedAssignment));
  }, [selectedAssignment, originalAssignment]);

  // Held here, not in the Properties tab, so an invalid assignment cannot be saved from the Subjects tab.
  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'assignment',
      isValid:
        !!selectedAssignment.policy &&
        !getExpiresAtError(selectedAssignment.expiresAt) &&
        areRulesValid(selectedAssignment.subject),
    });
  }, [dispatch, selectedAssignment.policy, selectedAssignment.expiresAt, selectedAssignment.subject]);

  const onDiscard = useCallback(() => {
    setSelectedAssignment(structuredClone(originalAssignment));
    setDiscardKey((prev) => prev + 1);
  }, [originalAssignment]);

  const onSave = useCallback(() => {
    getReqRef.current(updatePolicyAssignment, selectedAssignment, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.PlatformPolicyAssignments, t),
            getUpdateNotificationDescription(ApplicationRoute.PlatformPolicyAssignments, selectedAssignment.name, t),
          ),
        );
        fetchFiles(selectedAssignment._metadata?.folderId ?? 'platform/');
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedAssignment, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className={ENTITY_VIEW_CLASS_NAME}>
      <SimpleEntityHeader
        view={ApplicationRoute.PlatformPolicyAssignments}
        entity={selectedAssignment}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removePolicyAssignment}
        getAssetContext={usePolicyAssignmentsFolder}
      />

      <div className={ENTITY_VIEW_SCROLL_CLASS_NAME}>
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedAssignment}
            setSelectedEntity={setSelectedAssignment}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent activeTab={activeTab} selectedAssignment={selectedAssignment} onChange={setSelectedAssignment} />
        )}
      </div>
    </div>
  );
};

export default PolicyAssignmentAssetView;
