'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AlertVariant, DialAlert } from '@epam/ai-dial-ui-kit';

import { getRules } from '@/src/app/[lang]/folders-storage/actions';
import {
  approvePublication,
  declinePublication,
  deletePublication,
  updatePublication,
} from '@/src/app/actions/publications';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import PublicationsHeader from '@/src/components/EntityHeaderControls/PublicationsHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import BasePublicationHeader from '@/src/components/Publications/Properties/Header';
import PublicationProperties from '@/src/components/Publications/View/Properties';
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
import { EntityViewTab, getFilePublicationTabs } from '@/src/utils/tabs/utils';
import { addTrailingSlash } from '@/src/utils/url';
import TabsContent from './TabsContent';

interface Props<T> {
  view: ApplicationRoute;
  publication: T;
  applicationSchemes?: DialApplicationScheme[] | null;
}

const PublicationView = <T extends Publication>({ view, publication, applicationSchemes }: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const getReqRef = useRef(useProtectedRequest());
  const showNotificationRef = useRef(useNotification().showNotification);
  const { dispatch } = useSaveValidationContext();
  const { showNotification } = useNotification();
  const [isJsonView, setIsJsonView] = useState<boolean>(false);

  const [tabs, setTabs] = useState(() => getFilePublicationTabs(t));

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);

  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);

  const [selectedPublication, setSelectedPublication] = useState(structuredClone(publication));
  const [isPermissionsChanged, setIsPermissionsChanged] = useState(false);
  const [currentRules, setCurrentRules] = useState<DialRule[]>([]);

  const jsonConfiguration = useMemo<JsonConfiguration>(
    () => ({
      isEditorEnabled,
      onToggleEditor: () => {
        setIsEditorEnabled((prev) => !prev);
      },
    }),
    [isEditorEnabled],
  );

  useEffect(() => {
    setSelectedPublication(structuredClone(publication));
  }, [publication]);

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(selectedPublication, publication));
    setIsPermissionsChanged(!isEqualSkippingUndefined(currentRules, selectedPublication.rules));
    const error = selectedPublication.rules?.some(
      (rule) =>
        !rule.function ||
        !rule.source ||
        !(rule.targets.length > 0) ||
        (rule.targets.length && !rule.targets[0].length),
    );
    dispatch({ type: ValidationActionType.SetField, field: 'rules', isValid: !error });
  }, [selectedPublication, publication, t, currentRules, dispatch]);

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
    } else {
      getReqRef.current(getRules, selectedPublication.folderId).then((res) => {
        if (res.success) {
          const rule = res.response?.[selectedPublication.folderId] || [];
          setCurrentRules(rule);
          setIsPermissionsChanged(!isEqualSkippingUndefined(rule, selectedPublication.rules || []));
        } else {
          showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPublication.folderId]);

  const onDiscard = useCallback(() => {
    setSelectedPublication(structuredClone(publication));
  }, [publication]);

  const onChangePublication = useCallback((entity: T) => {
    setSelectedPublication(entity);
  }, []);

  const onSave = useCallback(() => {
    const req = getReqRef.current(updatePublication, selectedPublication);
    req.then((res) => {
      if (res.success) {
        dispatch({ type: ValidationActionType.Reset });
        showNotification(
          getSuccessNotification(
            getUpdateNotificationTitle(view, t),
            getUpdateNotificationDescription(view, publication.requestName, t),
          ),
        );
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [dispatch, publication.requestName, router, selectedPublication, showNotification, t, view]);

  const onApprove = useCallback(() => {
    approvePublication(publication.path).then((res) => {
      if (res.success) {
        router.push(view);
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [publication.path, router, showNotification, view]);

  const onDecline = useCallback(
    (comment: string) => {
      declinePublication(publication.path, comment).then((res) => {
        if (res.success) {
          router.push(view);
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [publication.path, router, showNotification, view],
  );

  const onDelete = useCallback(() => {
    deletePublication(publication.path).then((res) => {
      if (res.success) {
        router.push(view);
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [publication.path, router, showNotification, view]);

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

  const header = useMemo(() => {
    if (view === ApplicationRoute.FilePublications) {
      return (
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
          onApprove={onApprove}
          onDecline={onDecline}
          onDelete={onDelete}
        />
      );
    } else {
      return (
        <div className="flex flex-row justify-between min-h-[34px]">
          <div className="flex flex-row mb-3">
            <h1>{publication.requestName}</h1>
          </div>
          <BasePublicationHeader
            onApprove={onApprove}
            onDecline={onDecline}
            onDelete={onDelete}
            action={publication.action}
            route={view}
            isJsonView={isJsonView}
            setIsJsonView={setIsJsonView}
            isDelete={!!publication.resourceIssues?.length}
          />
        </div>
      );
    }
  }, [
    activeTab,
    isChanged,
    isJsonView,
    jsonConfiguration,
    onApprove,
    onDecline,
    onDelete,
    onDiscard,
    onSave,
    publication.action,
    publication.requestName,
    publication.resourceIssues?.length,
    selectedPublication,
    tabs,
    view,
    warning,
  ]);

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 pb-14 lg:pb-4 relative">
      {header}
      <div className="flex-1 overflow-auto min-h-0">
        {view === ApplicationRoute.FilePublications ? (
          isEditorEnabled ? (
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
                onChange={onChangePublication}
                isPermissionsChanged={isPermissionsChanged}
                currentRules={currentRules}
              />
            )
          )
        ) : isJsonView ? (
          <EntityJsonEditor entity={publication} readonly={true} />
        ) : (
          <PublicationProperties view={view} publication={publication} applicationSchemes={applicationSchemes} />
        )}
      </div>
    </div>
  );
};

export default PublicationView;
