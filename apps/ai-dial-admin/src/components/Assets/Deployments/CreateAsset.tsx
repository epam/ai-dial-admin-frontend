import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialCollapsibleSidebar, DialFormPopup, DialLabelledText, DialLoader, PopupSize } from '@epam/ai-dial-ui-kit';

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
  getRootFolder,
  getRootFolders,
  isPlatformBucketPath,
  isPlatformDualBucketView,
} from '@/src/utils/files/root-folder';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { DialResource } from '@/src/models/dial/resource';

interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  initialValues?: Partial<AssetWithVersion>;
  context?: () => AssetsFolderContextReader<AssetListItem>;
  onClose: () => void;
}

const CreateAsset: FC<Props> = ({ view, isModalOpen, initialValues, context, onClose }) => {
  const t = useI18n();
  const { isValid, dispatch } = useSaveValidationContext();
  const { showNotification } = useNotification();
  const { featureFlags } = useAppContext();
  const router = useRouter();
  const folderContext = context?.();
  const filePath = folderContext?.filePath as string;
  const data = folderContext?.data || [];
  const names = filterNames(data);
  const versionsMap = getVersionsPerName(data as AssetWithVersion[]);

  // Applications and Toolsets are the dual-bucket views — the selected destination folder is what
  // decides the create's shape, not just the view (see `getRootFolders`/`isPlatformBucketPath`).
  const isPlatformDualBucketCreate = DUAL_BUCKET_VIEWS.includes(view) && isPlatformBucketPath(filePath);

  // Both bucket roots for dual-bucket views (platform only when the Catalog menu group is enabled),
  // the single root for every other view — the same resolution the file manager sidebar uses.
  const rootPaths = useMemo(
    () => getRootFolders(view, featureFlags.catalogEnabled).map((root) => `${root}/`),
    [view, featureFlags.catalogEnabled],
  );

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
        router.push(getUrnForEntity(view, res.response || currentEntity));
        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [folderContext, currentEntity, onClose, router, showNotification, t, view]);

  const onChangeEntity = useCallback((entity: object) => {
    setCurrentEntity(entity as DialResource);
  }, []);

  useEffect(() => {
    setCurrentEntity((prev) => ({ ...prev, folderId: filePath }));
    dispatch({ type: ValidationActionType.SetField, field: 'name', isValid: !!currentEntity.name });

    if (view === ApplicationRoute.AssetsApplications || view === ApplicationRoute.AssetsToolsets) {
      dispatch({ type: ValidationActionType.SetField, field: 'displayName', isValid: !!currentEntity.displayName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath]);

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
    // public interlude registered for it. Back on public the version is the restored default, valid
    // by construction; AssetProperties re-validates it on edit.
    dispatch(
      isPlatformDualBucketCreate
        ? { type: ValidationActionType.RemoveField, field: 'version' }
        : { type: ValidationActionType.SetField, field: 'version', isValid: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlatformDualBucketCreate]);

  return (
    <DialFormPopup
      onClose={onClose}
      header={getCreateEntityTitle(view, t)}
      portalId="CreateAsset"
      size={PopupSize.Lg}
      className="h-[750px]"
      open={isModalOpen}
      onSubmit={() => onSubmit()}
      onCancel={onClose}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Create)}
      disableSubmitButton={!isValid}
    >
      <div className="flex flex-row px-6 py-4 h-full">
        <div className="flex flex-row gap-4 flex-1 min-h-0">
          <DialCollapsibleSidebar
            width={360}
            title={t(FoldersI18nKey.Folders)}
            containerClassName="border border-primary"
          >
            <FolderList context={context} rootPaths={rootPaths} />
          </DialCollapsibleSidebar>
          <div className="flex flex-col flex-1 min-h-0 bg-layer-2 px-6 py-4 overflow-auto">
            <h3>{t(EntityFieldsI18nKey.properties)}</h3>
            <div className="py-6">
              <DialLabelledText label={t(EntitiesI18nKey.FolderStorage)} text={filePath} />
            </div>
            {folderContext?.data == null ? (
              <DialLoader size={40} />
            ) : (
              <AssetProperties
                view={view}
                entity={currentEntity as unknown as AssetWithVersion}
                onChangeEntity={onChangeEntity}
                names={names}
                versionsMap={versionsMap}
                initialValues={initialValues}
                hideVersionField={isPlatformDualBucketCreate}
              />
            )}
          </div>
        </div>
      </div>
    </DialFormPopup>
  );
};

export default CreateAsset;
