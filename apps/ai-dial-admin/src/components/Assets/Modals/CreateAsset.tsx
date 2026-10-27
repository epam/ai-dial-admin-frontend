import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CollapsibleSidebar, Popup, LabelledText, Spinner, PopupSize } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';

import { getVersionsPerName } from '@/src/components/Assets/utils';
import { CreateAssetActionMap, PlatformCreateAssetActionMap } from '@/src/components/Assets/BaseAssetList/utils';
import { CreateAssetRoute } from '@/src/components/Assets/BaseAssetList/types';
import FolderList from '@/src/components/Common/FolderList/FolderList';
import AssetProperties from '@/src/components/EntityMainProperties/Properties/AssetProperties';
import { ButtonsI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { DEFAULT_NEW_ENTITY_VERSION } from '@/src/constants/dial-base-entity';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useAppContext } from '@/src/context/AppContext';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getCreateEntityTitle,
  getCreateNotificationDescription,
  getCreateNotificationTitle,
} from '@/src/utils/entities/create-entity';
import { filterNames } from '@/src/utils/entities/filter-names';
import {
  DUAL_BUCKET_VIEWS,
  FILE_ROOT_FOLDER,
  PLATFORM_ROOT_FOLDER,
  getRootFolder,
  getRootFolders,
  isFlatPlatformView,
  isPlatformBucketPath,
  isPlatformDualBucketView,
} from '@/src/utils/files/root-folder';
import { isVersionlessAssetView } from '@/src/utils/is-view';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { DialResource } from '@/src/models/dial/resource';

const PLATFORM_ROOT_PATH = `${PLATFORM_ROOT_FOLDER}/`;

interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  initialValues?: Partial<AssetWithVersion>;
  context?: () => AssetsFolderContextReader<AssetListItem>;
  /**
   * Opens on the `platform` root (both buckets stay selectable) and, while `platform` is the
   * destination, also rejects names Core's configuration file holds: an API write under such a name
   * replaces that entity rather than failing.
   */
  shouldOpenOnPlatform?: boolean;
  onClose: () => void;
}

const CreateAsset: FC<Props> = ({ view, isModalOpen, initialValues, context, shouldOpenOnPlatform, onClose }) => {
  const t = useI18n();
  const { isValid, dispatch } = useSaveValidationContext();
  const { showNotification } = useNotification();
  const { featureFlags } = useAppContext();
  const router = useRouter();
  const folderContext = context?.();
  const filePath = folderContext?.filePath as string;
  const folderItems = folderContext?.fetchedFoldersData[filePath];
  const hasFetchError = folderContext?.hasFetchError;
  // A public asset is addressed by its folder path, so only a platform destination can collide with
  // a config-file entity.
  const configFileItems =
    shouldOpenOnPlatform && isPlatformBucketPath(filePath)
      ? folderContext?.fetchedFoldersData[`${FILE_ROOT_FOLDER}/`]
      : undefined;
  const names = [...filterNames(folderItems), ...filterNames(configFileItems)];
  // Stable per folder: AssetProperties re-validates the version whenever this changes.
  const versionsMap = useMemo(() => getVersionsPerName((folderItems ?? []) as AssetWithVersion[]), [folderItems]);
  const isLoadingFolder = folderItems == null && !hasFetchError;

  // Applications and Toolsets are the dual-bucket views — the selected destination folder is what
  // decides the create's shape, not just the view (see `getRootFolders`/`isPlatformBucketPath`).
  const isPlatformDualBucketCreate = DUAL_BUCKET_VIEWS.includes(view) && isPlatformBucketPath(filePath);

  // Both bucket roots for dual-bucket views (platform only when the Catalog menu group is enabled),
  // the single root for every other view — the same resolution the file manager sidebar uses.
  const rootPaths = useMemo(
    () => getRootFolders(view, featureFlags.catalogEnabled).map((root) => `${root}/`),
    [view, featureFlags.catalogEnabled],
  );

  // The folder context opens on the last physical root (`public/`); move to `platform/` once, after
  // the initial roots load, and leave any later choice to the user.
  const isPlatformRootLoaded = folderContext?.fetchedFoldersData[PLATFORM_ROOT_PATH] != null;
  const hasOpenedOnPlatformRef = useRef(false);
  useEffect(() => {
    if (!shouldOpenOnPlatform || hasOpenedOnPlatformRef.current || !isPlatformRootLoaded) {
      return;
    }
    hasOpenedOnPlatformRef.current = true;
    if (filePath !== PLATFORM_ROOT_PATH) {
      folderContext?.setFilePath(PLATFORM_ROOT_PATH);
    }
  }, [shouldOpenOnPlatform, isPlatformRootLoaded, filePath, folderContext]);

  const [currentEntity, setCurrentEntity] = useState<DialResource>({
    ...initialValues,
    version: DEFAULT_NEW_ENTITY_VERSION,
  } as DialResource);

  const onSubmit = useCallback(async () => {
    // Which "create" call to make depends on the destination bucket, not just the view — the
    // platform variant pins the flat `platform/` path and drops the version (design D1).
    // `getRootFolder` (singular) is the right fallback: a dual-bucket view's own root is `public`,
    // unlike `getRootFolders`' platform-first ordering.
    const folderPath = (currentEntity.folderId as string) || `${getRootFolder(view)}/`;
    // `DialResource` no longer declares the flat `AssetWithVersion` identity (`path` moved to the
    // merged read's `_metadata`, which a freshly created entity never has) — hence the double cast.
    const createAsset = isPlatformDualBucketView(view, folderPath)
      ? () =>
          PlatformCreateAssetActionMap[view]!({ ...currentEntity, folderId: folderPath } as unknown as AssetWithVersion)
      : () =>
          CreateAssetActionMap[view as CreateAssetRoute]({
            ...currentEntity,
            folderId: folderPath,
          } as unknown as AssetWithVersion);

    createAsset().then((res) => {
      if (res.success) {
        folderContext?.fetchFiles(folderContext?.filePath);

        showNotification(
          getSuccessNotification(
            getCreateNotificationTitle(view, t),
            getCreateNotificationDescription(view, currentEntity.name, t),
          ),
        );
        const isFlatAsset = isFlatPlatformView(view) || isPlatformDualBucketCreate;
        let redirectEntity: Parameters<typeof getUrnForEntity>[1];
        if (isFlatAsset) {
          redirectEntity = { ...currentEntity, folderId: folderPath };
        } else if (isVersionlessAssetView(view)) {
          redirectEntity = { name: currentEntity.name, folderId: folderPath };
        } else {
          redirectEntity = { name: currentEntity.name, version: currentEntity.version, folderId: folderPath };
        }
        router.push(getUrnForEntity(view, redirectEntity));
        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [folderContext, currentEntity, isPlatformDualBucketCreate, onClose, router, showNotification, t, view]);

  const onChangeEntity = useCallback((entity: object) => {
    setCurrentEntity(entity as DialResource);
  }, []);

  useEffect(() => {
    setCurrentEntity((prev) => ({ ...prev, folderId: filePath }));
    // Once the folder has loaded, the mounted ID control owns `name` validity: it validates against
    // that folder's names on mount, and this effect runs after it, so dispatching here would overwrite
    // a "taken" result. Until then no form is shown, and submit stays blocked.
    if (isLoadingFolder) {
      dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: false });
    }

    if (view === ApplicationRoute.AssetsApplications || view === ApplicationRoute.AssetsToolsets) {
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !!currentEntity.displayName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath]);

  useEffect(() => {
    if (hasFetchError) {
      showNotification(getErrorNotification(t(FoldersI18nKey.LoadFolderError)));
    }
  }, [hasFetchError, showNotification, t]);

  // The bucket can be switched mid-modal via the folder sidebar, so the form follows it (design
  // D3): a platform destination has no version concept and starts with no granted roles; switching
  // back to the public bucket restores the default version. A public→public folder move never
  // enters either branch.
  useEffect(() => {
    setCurrentEntity((prev) => {
      if (isPlatformDualBucketCreate) {
        // `version: undefined` is the point — a platform resource is unversioned — but the field
        // is typed `string`, hence the double cast.
        return { ...prev, version: undefined, user_roles: [] } as unknown as DialResource;
      }
      return prev.version == null ? ({ ...prev, version: DEFAULT_NEW_ENTITY_VERSION } as DialResource) : prev;
    });
    // A hidden version field must not gate submit — `RemoveField` also clears whatever validity a
    // public interlude registered for it. Back on public, AssetProperties validates the restored
    // default against the folder; marking it valid here would overwrite that result.
    if (isPlatformDualBucketCreate) {
      dispatch({ type: ValidationActionType.RemoveField, field: 'version' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlatformDualBucketCreate]);

  return (
    <Popup
      onClose={onClose}
      header={getCreateEntityTitle(view, t)}
      portalId="CreateAsset"
      size={PopupSize.Lg}
      className="md:h-[750px]"
      open={isModalOpen}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Create),
        isSubmitDisabled: !isValid,
        onCancel: onClose,
        onSubmit: () => onSubmit(),
      })}
    >
      <div className="flex flex-row px-6 py-4 h-full">
        <div className="flex flex-row gap-4 flex-1 min-h-0">
          <CollapsibleSidebar width={360} title={t(FoldersI18nKey.Folders)} className="border border-primary">
            <FolderList context={context} rootPaths={rootPaths} />
          </CollapsibleSidebar>
          <div className="flex flex-col flex-1 min-h-0 bg-layer-2 px-6 py-4 overflow-auto">
            <h3>{t(EntityFieldsI18nKey.properties)}</h3>
            <div className="py-6">
              <LabelledText label={t(EntitiesI18nKey.FolderStorage)} text={filePath} />
            </div>
            {isLoadingFolder ? (
              <Spinner size={40} fullWidth />
            ) : (
              <AssetProperties
                // The ID field validates on input and on mount only; remounting per folder re-checks the
                // name against the new folder's population (a config-file name is taken on `platform/`
                // but free on `public/`, and each public folder holds its own names). The version is
                // re-checked by AssetProperties itself.
                key={filePath}
                view={view}
                entity={currentEntity as unknown as AssetWithVersion}
                onChangeEntity={onChangeEntity}
                names={names}
                versionsMap={versionsMap}
                hideVersionField={isPlatformDualBucketCreate}
              />
            )}
          </div>
        </div>
      </div>
    </Popup>
  );
};

export default CreateAsset;
