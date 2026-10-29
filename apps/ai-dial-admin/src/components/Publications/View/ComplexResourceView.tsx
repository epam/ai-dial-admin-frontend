'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Notification, NotificationType, NotificationVariant, TabStatus } from '@epam/ai-dial-ui-kit';

import { getRules } from '@/src/app/[lang]/folders-storage/actions';
import { getContextLimits, getProjectManifest } from '@/src/app/[lang]/projects/actions';
import { updatePublication } from '@/src/app/actions/publications';
import { useProjectStaging } from '@/src/components/Assets/Artifacts/Projects/View/use-project-staging';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import PublicationsHeader from '@/src/components/EntityHeaderControls/PublicationsHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import {
  DEFAULT_PROJECT_CONTEXT_ALLOWED_EXTENSIONS,
  DEFAULT_PROJECT_CONTEXT_FILE_MAX_BYTES,
  DEFAULT_PROJECT_CONTEXT_TOTAL_MAX_BYTES,
  PROJECT_CONTEXT_MAX_FILES,
} from '@/src/constants/project';
import { ROOT_FOLDER } from '@/src/constants/file';
import { PublicationsI18nKey } from '@/src/constants/i18n';
import { useProjectFolder } from '@/src/context/assets/ProjectFolderContext';
import { useSkillFolder } from '@/src/context/assets/SkillFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { ProjectPublication, Publication, SkillPublication } from '@/src/models/dial/publications';
import { DialProjectFile } from '@/src/models/dial/resource';
import { DialRule } from '@/src/models/dial/rule';
import { ProjectContextLimits } from '@/src/models/project-context';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { EntityViewTab, getPublicationViewTabs, getTabStatusProps } from '@/src/utils/tabs/utils';
import { addTrailingSlash } from '@/src/utils/url';
import ComplexResourceTabsContent from './ComplexResourceTabsContent';
import { useSkillPublicationStaging } from './use-skill-publication-staging';
import { getFormDataForPublication } from './utils';

type ComplexResourceView = ApplicationRoute.SkillPublications | ApplicationRoute.ProjectPublications;

interface Props<T> {
  view: ComplexResourceView;
  publication: T;
}

/** Context limits used until the deployment's own limits arrive; the server remains the authority. */
const FALLBACK_PROJECT_LIMITS: ProjectContextLimits = {
  allowedExtensions: DEFAULT_PROJECT_CONTEXT_ALLOWED_EXTENSIONS,
  maxFileBytes: DEFAULT_PROJECT_CONTEXT_FILE_MAX_BYTES,
  maxTotalBytes: DEFAULT_PROJECT_CONTEXT_TOTAL_MAX_BYTES,
  maxFiles: PROJECT_CONTEXT_MAX_FILES,
};

const NO_FILES: DialProjectFile[] = [];

/**
 * Publication detail view for the complex-resource types — Skill and Project. Both are folders of files rather
 * than single-document resources, so their staged edits (files, `SKILL.md`, `PROJECT.md`) are written directly
 * against Core's per-file routes after `updatePublication` succeeds, instead of through the publication payload.
 * The other publication types render through the generic `PublicationView`.
 */
const ComplexResourcePublicationView = <T extends Publication>({ view, publication }: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const getReqRef = useRef(useProtectedRequest());
  const showNotificationRef = useRef(useNotification().showNotification);
  const { dispatch } = useSaveValidationContext();
  const { showNotification } = useNotification();
  const isProject = view === ApplicationRoute.ProjectPublications;
  const skillFolder = useSkillFolder();
  const projectFolder = useProjectFolder();
  const folderContext = isProject ? projectFolder : skillFolder;

  const [tabs, setTabs] = useState(() => getPublicationViewTabs(t, view));
  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);
  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);
  const [selectedPublication, setSelectedPublication] = useState(structuredClone(publication));
  const [isPermissionsChanged, setIsPermissionsChanged] = useState(false);
  const [currentRules, setCurrentRules] = useState<DialRule[]>([]);

  const skillPath = isProject
    ? undefined
    : (selectedPublication as unknown as SkillPublication).skillResources?.[0]?.skillResource.path;
  const project = isProject
    ? (selectedPublication as unknown as ProjectPublication).projectResources?.[0]?.projectResource
    : undefined;

  const skillStaging = useSkillPublicationStaging({
    skillPath,
    isManifestTabActive: activeTab === EntityViewTab.Skill,
  });
  const { reset: resetSkillStaging } = skillStaging;

  const [projectManifestContent, setProjectManifestContent] = useState<string | undefined>(undefined);
  const [projectLimits, setProjectLimits] = useState<ProjectContextLimits>(FALLBACK_PROJECT_LIMITS);
  const projectStaging = useProjectStaging({
    manifestContent: projectManifestContent,
    projectName: project?.name ?? '',
    files: project?.files ?? NO_FILES,
  });

  useEffect(() => {
    let isCurrent = true;
    getContextLimits().then((limits) => {
      if (isCurrent) {
        setProjectLimits(limits);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, []);

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

  // A new publication (first render, or after a save refreshed it) drops what was cached for the old one, and the
  // project's manifest is read again — it is not part of the publication, so it would otherwise stay blank.
  const publicationProjectPath = isProject
    ? (publication as unknown as ProjectPublication).projectResources?.[0]?.projectResource.path
    : undefined;
  useEffect(() => {
    setSelectedPublication(structuredClone(publication));
    resetSkillStaging();
    setProjectManifestContent(undefined);
    if (!publicationProjectPath) {
      return;
    }
    let isCurrent = true;
    // A missing or unreadable `PROJECT.md` is not a missing project: the fields just render empty.
    getProjectManifest(publicationProjectPath).then((result) => {
      if (isCurrent) {
        setProjectManifestContent(result.success ? (result.response as string) : '');
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [publication, publicationProjectPath, resetSkillStaging]);

  // Both stagings share `isChanged` / `discard` / `apply(path)`; only the open publication's type has anything staged.
  const activeStaging = isProject ? projectStaging : skillStaging;
  const isStagingChanged = activeStaging.isChanged;
  const { discard: discardStaging, apply: applyStaging } = activeStaging;

  useEffect(() => {
    setIsChanged(!isEqualSkippingUndefined(selectedPublication, publication) || isStagingChanged);
    setIsPermissionsChanged(!isEqualSkippingUndefined(currentRules, selectedPublication.rules));
    const error = selectedPublication.rules?.some(
      (rule) =>
        !rule.function ||
        !rule.source ||
        !(rule.targets.length > 0) ||
        (rule.targets.length && !rule.targets[0].length),
    );
    dispatch({ type: ValidationActionType.SetField, field: 'rules', isValid: !error });
  }, [selectedPublication, publication, currentRules, dispatch, isStagingChanged]);

  useEffect(() => {
    setTabs((prev) => {
      return prev.map((tab) => {
        if (tab.id === EntityViewTab.Permissions) {
          return { ...tab, ...getTabStatusProps(t, isPermissionsChanged ? TabStatus.Warning : undefined) };
        }
        return tab;
      });
    });
  }, [isPermissionsChanged, t]);

  useEffect(() => {
    if (selectedPublication.folderId === addTrailingSlash(ROOT_FOLDER) || !selectedPublication.folderId.endsWith('/')) {
      setIsPermissionsChanged(false);
      return;
    }

    const timeout = setTimeout(() => {
      getReqRef.current(getRules, selectedPublication.folderId).then((res) => {
        if (res.success) {
          const rule = res.response?.[selectedPublication.folderId] || [];
          setCurrentRules(rule);
        } else {
          showNotificationRef.current(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [selectedPublication.folderId]);

  const onDiscard = useCallback(() => {
    setSelectedPublication(structuredClone(publication));
    discardStaging();
    setDiscardKey((prev) => prev + 1);
  }, [publication, discardStaging]);

  /** Writes the staged resource edits after the publication itself saved; they aren't publication fields. */
  const applyResourceChanges = useCallback(
    async (savedPublication: Publication): Promise<ServerActionResponse> => {
      const path = isProject
        ? (savedPublication as ProjectPublication).projectResources?.[0]?.projectResource.path
        : (savedPublication as SkillPublication).skillResources?.[0]?.skillResource.path;
      return isStagingChanged && path ? applyStaging(path) : { success: true };
    },
    [applyStaging, isProject, isStagingChanged],
  );

  const onSave = useCallback(() => {
    const correctFolderId = addTrailingSlash(selectedPublication.folderId);
    const body = getFormDataForPublication(
      {
        ...selectedPublication,
        folderId: correctFolderId,
        rules: correctFolderId === addTrailingSlash(ROOT_FOLDER) ? [] : selectedPublication.rules, // if publication is in root folder, it can't have any rules, so we set it to empty array
      },
      [],
    );
    const req = getReqRef.current(updatePublication, body);
    req.then(async (res) => {
      if (res.success) {
        const resourceResult = await applyResourceChanges(selectedPublication);
        if (!resourceResult.success) {
          showNotification(getErrorNotification(resourceResult.errorHeader, resourceResult.errorMessage));
          return;
        }

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
  }, [applyResourceChanges, dispatch, publication.requestName, router, selectedPublication, showNotification, t, view]);

  const warning = useMemo(() => {
    if (publication.resourceIssues?.length) {
      return (
        <Notification
          type={NotificationType.SectionMessage}
          className="mt-8"
          variant={NotificationVariant.Warning}
          message={
            <div className="flex flex-col gap-3">
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
        getAssetContext={() => folderContext}
      />
      <div className="flex-1 overflow-auto min-h-0">
        {isEditorEnabled ? (
          <EntityJsonEditor
            key={discardKey}
            entity={selectedPublication}
            setSelectedEntity={setSelectedPublication}
            setIsChanged={setIsChanged}
          />
        ) : (
          !warning && (
            <ComplexResourceTabsContent
              key={discardKey}
              view={view}
              activeTab={activeTab}
              selectedPublication={selectedPublication}
              onChange={onChangePublication as (publication: Publication) => void}
              isPermissionsChanged={isPermissionsChanged}
              currentRules={currentRules}
              skillStaging={skillStaging}
              projectStaging={projectStaging}
              projectLimits={projectLimits}
            />
          )
        )}
      </div>
    </div>
  );
};

export default ComplexResourcePublicationView;
