'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DialNotification, NotificationVariant } from '@epam/ai-dial-ui-kit';

import { getRules } from '@/src/app/[lang]/folders-storage/actions';
import { getSkillManifest, removeSkillFile, uploadSkillFile } from '@/src/app/[lang]/skills/actions';
import { updatePublication } from '@/src/app/actions/publications';
import ResourceAuthButtons from '@/src/components/Assets/Resources/Auth/ResourceAuthButtons';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import PublicationsHeader from '@/src/components/EntityHeaderControls/PublicationsHeader';
import EntityJsonEditor from '@/src/components/EntityTabs/JsonEditor/JsonEditor';
import { ROOT_FOLDER } from '@/src/constants/file';
import { PublicationsI18nKey } from '@/src/constants/i18n';
import { useAppsFolder } from '@/src/context/assets/AppsFolderContext';
import { useConversationFolder } from '@/src/context/assets/ConversationsFolderContext';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { useSkillFolder } from '@/src/context/assets/SkillFolderContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialApplicationScheme } from '@/src/models/dial/application';
import {
  FilePublication,
  PromptPublication,
  Publication,
  SkillPublication,
  ToolsetPublication,
} from '@/src/models/dial/publications';
import { DialToolsetResource, ToolsetAuthType } from '@/src/models/dial/resource';
import { DialRule } from '@/src/models/dial/rule';
import { ApplicationRoute } from '@/src/types/routes';
import { getUpdateNotificationDescription, getUpdateNotificationTitle } from '@/src/utils/entities/update-entity';
import { isEqualSkippingUndefined } from '@/src/utils/is-equals-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { buildSkillManifest, parseSkillManifest, SkillManifest } from '@/src/utils/skill-manifest';
import { EntityViewTab, getPublicationViewTabs } from '@/src/utils/tabs/utils';
import { addTrailingSlash } from '@/src/utils/url';
import TabsContent from './TabsContent';
import { getCorrectPublication, getFormDataForPublication } from './utils';
import { signInToolset, signOutToolset } from '@/src/app/[lang]/assets-toolsets/actions';

interface Props<T> {
  view: ApplicationRoute;
  publication: T;
  applicationSchemes?: DialApplicationScheme[];
  oAuthCode?: string | null;
}

// Maps a Publications route to the same-entity Assets folder context, so approving a publication can
// refresh the corresponding Assets folder listing the published entity now belongs to.
const PublicationFolderContextMap = {
  [ApplicationRoute.ApplicationPublications]: useAppsFolder,
  [ApplicationRoute.ToolsetPublications]: useToolsetFolder,
  [ApplicationRoute.PromptPublications]: usePromptFolder,
  [ApplicationRoute.FilePublications]: useFileFolder,
  [ApplicationRoute.ConversationPublications]: useConversationFolder,
  [ApplicationRoute.SkillPublications]: useSkillFolder,
};

const PublicationView = <T extends Publication>({ view, publication, applicationSchemes, oAuthCode }: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const getReqRef = useRef(useProtectedRequest());
  const showNotificationRef = useRef(useNotification().showNotification);
  const { dispatch } = useSaveValidationContext();
  const { showNotification } = useNotification();
  const folderContext = PublicationFolderContextMap[view as keyof typeof PublicationFolderContextMap]();

  const toolset = useMemo(() => {
    if (view === ApplicationRoute.ToolsetPublications) {
      const toolsetPub = publication as unknown as ToolsetPublication;
      return toolsetPub.toolSetResources?.[0]?.toolSetResource as unknown as DialToolsetResource;
    }
    return null;
  }, [view, publication]);

  const [tabs, setTabs] = useState(() => getPublicationViewTabs(t, view));

  const [activeTab, setActiveTab] = useState(EntityViewTab.Properties);

  const [isChanged, setIsChanged] = useState(false);
  const [isEditorEnabled, setIsEditorEnabled] = useState(false);
  const [discardKey, setDiscardKey] = useState(0);

  const [selectedPublication, setSelectedPublication] = useState(structuredClone(publication));
  const [isPermissionsChanged, setIsPermissionsChanged] = useState(false);
  const [currentRules, setCurrentRules] = useState<DialRule[]>([]);

  const [addedFiles, setAddedFiles] = useState<File[]>([]);
  const [skillAddedFiles, setSkillAddedFiles] = useState<File[]>([]);
  const [skillRemovedFileNames, setSkillRemovedFileNames] = useState<string[]>([]);

  // `SKILL.md`'s raw last-fetched content, its parsed manifest, and the staged edit — same shape as
  // `Assets > Skills`' `SkillView` (see its doc comment on `buildSkillManifest` for why the original
  // content is needed alongside the parsed fields).
  const [skillManifestContent, setSkillManifestContent] = useState<string | undefined>(undefined);
  const [skillManifest, setSkillManifest] = useState<SkillManifest | undefined>(undefined);
  const [skillStagedManifest, setSkillStagedManifest] = useState<SkillManifest | undefined>(undefined);

  const skillManifestPath =
    view === ApplicationRoute.SkillPublications
      ? (selectedPublication as unknown as SkillPublication).skillResources?.[0]?.skillResource.path
      : undefined;

  const isSkillManifestChanged =
    !!skillManifest &&
    !!skillStagedManifest &&
    (skillStagedManifest.description !== skillManifest.description || skillStagedManifest.body !== skillManifest.body);

  // Lazy-fetch `SKILL.md`'s content on first activation of the Skill tab, rather than eagerly with
  // the rest of the page.
  useEffect(() => {
    if (activeTab !== EntityViewTab.Skill || skillManifestContent !== undefined || !skillManifestPath) {
      return;
    }
    getSkillManifest(skillManifestPath).then((result) => {
      if (!result.success) {
        showNotification(getErrorNotification(result.errorHeader, result.errorMessage));
        return;
      }
      const content = result.response as string;
      const parsed = parseSkillManifest(content);
      setSkillManifestContent(content);
      setSkillManifest(parsed);
      setSkillStagedManifest(parsed);
    });
  }, [activeTab, skillManifestContent, skillManifestPath, showNotification]);

  const onChangeSkillDescription = useCallback((description: string) => {
    setSkillStagedManifest((prev) => (prev ? { ...prev, description } : prev));
  }, []);

  const onChangeSkillBody = useCallback((body: string) => {
    setSkillStagedManifest((prev) => (prev ? { ...prev, body } : prev));
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

  useEffect(() => {
    setSelectedPublication(structuredClone(publication));
    setSkillManifestContent(undefined);
    setSkillManifest(undefined);
    setSkillStagedManifest(undefined);
  }, [publication]);

  useEffect(() => {
    setIsChanged(
      !isEqualSkippingUndefined(selectedPublication, publication) ||
        addedFiles.length > 0 ||
        skillAddedFiles.length > 0 ||
        skillRemovedFileNames.length > 0 ||
        isSkillManifestChanged,
    );
    setIsPermissionsChanged(!isEqualSkippingUndefined(currentRules, selectedPublication.rules));
    const error = selectedPublication.rules?.some(
      (rule) =>
        !rule.function ||
        !rule.source ||
        !(rule.targets.length > 0) ||
        (rule.targets.length && !rule.targets[0].length),
    );
    dispatch({ type: ValidationActionType.SetField, field: 'rules', isValid: !error });
  }, [
    selectedPublication,
    publication,
    t,
    currentRules,
    dispatch,
    addedFiles.length,
    skillAddedFiles.length,
    skillRemovedFileNames.length,
    isSkillManifestChanged,
  ]);

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
    setAddedFiles([]);
    setSkillAddedFiles([]);
    setSkillRemovedFileNames([]);
    setSkillStagedManifest(skillManifest);
    setDiscardKey((prev) => prev + 1);
  }, [publication, skillManifest]);

  /**
   * Applies staged Skill file changes and a staged manifest edit directly against Core's per-file
   * skill routes — these aren't publication fields `updatePublication` can persist, so they're a
   * separate step after it succeeds. File removals first, so a name freed by a removal can be reused
   * by an added file in the same save; the manifest write doesn't interact with either.
   */
  const applySkillFileChanges = useCallback(
    async (skillPath: string) => {
      if (isSkillManifestChanged && skillManifestContent && skillManifest && skillStagedManifest) {
        const content = buildSkillManifest(skillManifestContent, {
          name: skillManifest.name,
          description: skillStagedManifest.description,
          body: skillStagedManifest.body,
        });
        const formData = new FormData();
        formData.append('file', new File([content], 'SKILL.md', { type: 'text/markdown' }));
        const result = await uploadSkillFile(skillPath, 'SKILL.md', formData);
        if (!result.success) {
          return result;
        }
        setSkillManifestContent(content);
        setSkillManifest(skillStagedManifest);
      }
      for (const fileName of skillRemovedFileNames) {
        const result = await removeSkillFile(skillPath, fileName);
        if (!result.success) {
          return result;
        }
      }
      for (const file of skillAddedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const result = await uploadSkillFile(skillPath, file.name, formData);
        if (!result.success) {
          return result;
        }
      }
      return { success: true };
    },
    [
      skillRemovedFileNames,
      skillAddedFiles,
      isSkillManifestChanged,
      skillManifestContent,
      skillManifest,
      skillStagedManifest,
    ],
  );

  const onSave = useCallback(() => {
    const correctedPublication =
      view === ApplicationRoute.ApplicationPublications
        ? getCorrectPublication(selectedPublication)
        : selectedPublication;
    const correctFolderId = addTrailingSlash(correctedPublication.folderId);
    const body = getFormDataForPublication(
      {
        ...correctedPublication,
        folderId: correctFolderId,
        rules: correctFolderId === addTrailingSlash(ROOT_FOLDER) ? [] : selectedPublication.rules, // if publication is in root folder, it can't have any rules, so we set it to empty array
      },
      addedFiles,
    );
    const req = getReqRef.current(updatePublication, body);
    req.then(async (res) => {
      if (res.success) {
        if (
          view === ApplicationRoute.SkillPublications &&
          (skillAddedFiles.length || skillRemovedFileNames.length || isSkillManifestChanged)
        ) {
          const skillPath = (correctedPublication as unknown as SkillPublication).skillResources?.[0]?.skillResource
            .path;
          const skillFilesResult = skillPath ? await applySkillFileChanges(skillPath) : { success: true };
          if (!skillFilesResult.success) {
            showNotification(
              getErrorNotification(
                (skillFilesResult as { errorHeader?: string }).errorHeader,
                (skillFilesResult as { errorMessage?: string }).errorMessage,
              ),
            );
            return;
          }
          setSkillAddedFiles([]);
          setSkillRemovedFileNames([]);
        }

        dispatch({ type: ValidationActionType.Reset });

        const shouldRedirectToListView =
          (view === ApplicationRoute.PromptPublications &&
            (correctedPublication as unknown as PromptPublication).prompts?.length === 0) ||
          (view === ApplicationRoute.FilePublications &&
            (correctedPublication as unknown as FilePublication).files?.length === 0);

        if (shouldRedirectToListView) {
          router.push(view);
        } else {
          showNotification(
            getSuccessNotification(
              getUpdateNotificationTitle(view, t),
              getUpdateNotificationDescription(view, publication.requestName, t),
            ),
          );
          setAddedFiles([]);
          router.refresh();
        }
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [
    dispatch,
    publication.requestName,
    router,
    selectedPublication,
    showNotification,
    t,
    view,
    addedFiles,
    skillAddedFiles,
    skillRemovedFileNames,
    isSkillManifestChanged,
    applySkillFileChanges,
  ]);

  const warning = useMemo(() => {
    if (publication.resourceIssues?.length) {
      return (
        <DialNotification
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
      >
        {view === ApplicationRoute.ToolsetPublications &&
          toolset &&
          !isChanged &&
          toolset.auth_settings?.authentication_type &&
          toolset.auth_settings?.authentication_type !== ToolsetAuthType.NONE && (
            <ResourceAuthButtons
              selectedToolset={toolset}
              oAuthCode={oAuthCode}
              publicationName={publication.requestName}
              publicationPath={publication.path}
              view={ApplicationRoute.ToolsetPublications}
              signInToolset={signInToolset}
              signOutToolset={signOutToolset}
            />
          )}
      </PublicationsHeader>
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
            <TabsContent
              key={discardKey}
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
              skillAddedFiles={skillAddedFiles}
              setSkillAddedFiles={setSkillAddedFiles}
              skillRemovedFileNames={skillRemovedFileNames}
              setSkillRemovedFileNames={setSkillRemovedFileNames}
              skillManifest={skillStagedManifest}
              onChangeSkillDescription={onChangeSkillDescription}
              onChangeSkillBody={onChangeSkillBody}
            />
          )
        )}
      </div>
    </div>
  );
};

export default PublicationView;
