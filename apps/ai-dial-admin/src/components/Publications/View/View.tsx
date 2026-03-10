'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AlertVariant, DialAlert } from '@epam/ai-dial-ui-kit';

import { getRules } from '@/src/app/[lang]/folders-storage/actions';
import { updatePublication } from '@/src/app/actions/publications';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import PublicationsHeader from '@/src/components/EntityHeaderControls/PublicationsHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ROOT_FOLDER } from '@/src/constants/file';
import { PublicationsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import { Publication } from '@/src/models/dial/publications';
import { DialRule } from '@/src/models/dial/rule';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getPublicationViewTabs } from '@/src/utils/tabs/utils';
import { addTrailingSlash } from '@/src/utils/url';
import TabsContent from './TabsContent';
import { getFormDataForPublication } from './utils';

interface Props<T> {
  view: ApplicationRoute;
  publication: T;
  applicationSchemes?: DialApplicationScheme[];
}

const PublicationView = <T extends Publication>({ view, publication, applicationSchemes }: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const getReqRef = useRef(useProtectedRequest());
  const showNotificationRef = useRef(useNotification().showNotification);
  const { dispatch } = useSaveValidationContext();
  const { showNotification } = useNotification();

  const [tabs, setTabs] = useState(() => getPublicationViewTabs(t, view));

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);

  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);

  const [selectedPublication, setSelectedPublication] = useState(structuredClone(publication));
  const [isPermissionsChanged, setIsPermissionsChanged] = useState(false);
  const [currentRules, setCurrentRules] = useState<DialRule[]>([]);

  const [addedFiles, setAddedFiles] = useState<File[]>([]);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => {
        setIsEditorEnabled((prev) => !prev);
      },
    }),
    [isEditorEnabled],
  );

  const onChangePublication = useCallback((entity: T) => {
    setSelectedPublication(entity);
  }, []);

  useEffect(() => {
    setSelectedPublication(structuredClone(publication));
  }, [publication]);

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(selectedPublication, publication) || addedFiles.length > 0);
    setIsPermissionsChanged(!isEqualSkippingUndefined(currentRules, selectedPublication.rules));
    const error = selectedPublication.rules?.some(
      (rule) =>
        !rule.function ||
        !rule.source ||
        !(rule.targets.length > 0) ||
        (rule.targets.length && !rule.targets[0].length),
    );
    dispatch({ type: ValidationActionType.SetField, field: 'rules', isValid: !error });
  }, [selectedPublication, publication, t, currentRules, dispatch, addedFiles.length]);

  useEffect(() => {
    setTabs((prev) => {
      return prev.map((tab) => {
        if (tab.id === EntityViewTab.Permissions) {
          return { ...tab, warning: isPermissionsChanged };
        }
        return tab;
      });
    });
  }, [isPermissionsChanged]);

  useEffect(() => {
    if (selectedPublication.folderId === addTrailingSlash(ROOT_FOLDER)) {
      setIsPermissionsChanged(false);
      return;
    }

    const timeout = setTimeout(() => {
      getReqRef.current(getRules, selectedPublication.folderId).then((res) => {
        if (res.success) {
          const rule = res.response?.[selectedPublication.folderId] || [];
          setCurrentRules(rule);
          setIsPermissionsChanged(!isEqualSkippingUndefined(rule, selectedPublication.rules || []));
        } else {
          showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    }, 1000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPublication.folderId]);

  const onDiscard = useCallback(() => {
    setSelectedPublication(structuredClone(publication));
    setAddedFiles([]);
  }, [publication]);

  const onSave = useCallback(() => {
    const body = getFormDataForPublication(
      {
        ...selectedPublication,
        folderId: addTrailingSlash(selectedPublication.folderId),
      },
      addedFiles,
    );
    const req = getReqRef.current(updatePublication, body);
    req.then((res) => {
      if (res.success) {
        dispatch({ type: ValidationActionType.Reset });
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(view, t),
            getUpdateNotificationDescription(view, publication.requestName, t),
          ),
        );
        setAddedFiles([]);
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [dispatch, publication.requestName, router, selectedPublication, showNotification, t, view, addedFiles]);

  const warning = useMemo(() => {
    if (publication.resourceIssues?.length) {
      return (
        <DialAlert
          className="mt-8"
          variant={AlertVariant.Warning}
          message={
            <div className="flex flex-col gap-3 ">
              <h3>{publication.resourceIssues[0].message}</h3>
              <span className="text-sm">{t(PublicationsI18nKey.Warning)}</span>
            </div>
          }
        />
      );
    }
    return null;
  }, [publication.resourceIssues, t]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      <PublicationsHeader
        view={view}
        entity={selectedPublication}
        isChanged={isChanged}
        onDiscard={onDiscard}
        onSave={onSave}
        tabs={tabs}
        jsonConfiguration={jsonConfiguration}
        activeTab={activeTab}
        warning={warning}
        onChangeActiveTab={setActiveTab}
      />
      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            entity={selectedPublication}
            setSelectedEntity={setSelectedPublication}
            setIsChanged={setIsChanged}
          />
        ) : (
          !warning && (
            <TabsContent
              view={view}
              activeTab={activeTab}
              selectedPublication={selectedPublication}
              originalPublication={publication}
              applicationSchemes={applicationSchemes}
              onChange={onChangePublication}
              isPermissionsChanged={isPermissionsChanged}
              currentRules={currentRules}
              addedFiles={addedFiles}
              setAddedFiles={setAddedFiles}
            />
          )
        )}
      </div>
    </div>
  );
};

export default PublicationView;
