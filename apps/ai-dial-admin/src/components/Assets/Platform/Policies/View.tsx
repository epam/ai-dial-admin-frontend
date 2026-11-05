'use client';

import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { removePolicy, updatePolicy } from '@/src/app/[lang]/platform-policies/actions';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import SimpleEntityHeader from '@/src/components/EntityHeaderControls/SimpleHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ENTITY_VIEW_CLASS_NAME, ENTITY_VIEW_SCROLL_CLASS_NAME } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { usePoliciesFolder } from '@/src/context/assets/PoliciesFolderContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialPolicyResource } from '@/src/models/dial/resource';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { areRulesValid } from '@/src/utils/policies/subjects';
import { getPolicyFormErrors } from '@/src/utils/policies/validation';
import { EntityViewTab, getTabsForAsset } from '@/src/utils/tabs/utils';
import TabsContent from './TabsContent';

interface Props {
  etag: string;
  originalPolicy: DialPolicyResource;
}

const PolicyAssetView: FC<Props> = ({ etag, originalPolicy }) => {
  const t = useI18n();
  const router = useRouter();
  const { fetchFiles } = usePoliciesFolder();
  const { showNotification } = useNotification();
  const { dispatch } = useSaveValidationContext();
  const getReqRef = useRef(useProtectedRequest());

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [selectedPolicy, setSelectedPolicy] = useState(structuredClone(originalPolicy));
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => setIsEditorEnabled((prev) => !prev),
      // A policy has no admin-backend projection, so there is no format to choose between.
      onHideFormatSelector: () => true,
    }),
    [isEditorEnabled],
  );

  const tabs = useMemo(() => getTabsForAsset(t, ApplicationRoute.PlatformPolicies), [t]);

  useEffect(() => {
    setSelectedPolicy(structuredClone(originalPolicy));
  }, [originalPolicy]);

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(originalPolicy, selectedPolicy));
  }, [selectedPolicy, originalPolicy]);

  // Held here, not in the Properties tab, so a policy that is invalid cannot be saved from the Subjects tab.
  useEffect(() => {
    dispatch({
      type: ValidationActionType.SetField,
      field: 'policy',
      isValid: Object.keys(getPolicyFormErrors(selectedPolicy)).length === 0 && areRulesValid(selectedPolicy.subject),
    });
  }, [dispatch, selectedPolicy]);

  const onDiscard = useCallback(() => {
    setSelectedPolicy(structuredClone(originalPolicy));
    setDiscardKey((prev) => prev + 1);
  }, [originalPolicy]);

  const onSave = useCallback(() => {
    getReqRef.current(updatePolicy, selectedPolicy, etag).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(ApplicationRoute.PlatformPolicies, t),
            getUpdateNotificationDescription(ApplicationRoute.PlatformPolicies, selectedPolicy.name, t),
          ),
        );
        fetchFiles(selectedPolicy._metadata?.folderId ? `platform/${selectedPolicy._metadata.folderId}` : 'platform/');
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [selectedPolicy, etag, showNotification, t, router, fetchFiles]);

  return (
    <div className={ENTITY_VIEW_CLASS_NAME}>
      <SimpleEntityHeader
        view={ApplicationRoute.PlatformPolicies}
        entity={selectedPolicy}
        etag={etag}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        onChangeActiveTab={setActiveTab}
        onRemove={removePolicy}
        getAssetContext={usePoliciesFolder}
      />

      <div className={ENTITY_VIEW_SCROLL_CLASS_NAME}>
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedPolicy}
            setSelectedEntity={setSelectedPolicy}
            setIsChanged={setIsChanged}
          />
        ) : (
          <TabsContent activeTab={activeTab} selectedPolicy={selectedPolicy} onChange={setSelectedPolicy} />
        )}
      </div>
    </div>
  );
};

export default PolicyAssetView;
