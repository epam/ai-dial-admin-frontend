import { useRouter } from 'next/navigation';
import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { CollapsibleSidebar, Popup, LabelledText, Spinner, PopupSize } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';

import { getVersionsPerName } from '@/src/components/Assets/utils';
import { CreateAssetActionMap } from '@/src/components/Assets/BaseAssetList/utils';
import { CreateAssetRoute } from '@/src/components/Assets/BaseAssetList/types';
import FolderList from '@/src/components/Common/FolderList/FolderList';
import AssetProperties from '@/src/components/EntityMainProperties/Properties/AssetProperties';
import { ButtonsI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { DEFAULT_NEW_ENTITY_VERSION } from '@/src/constants/dial-base-entity';
import { ROOT_FOLDER } from '@/src/constants/file';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
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
import { isVersionlessAssetView } from '@/src/utils/is-view';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { DialResource } from '@/src/models/dial/resource';

interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  initialValues?: Partial<AssetWithVersion>;
  context?: () => AssetsFolderContextReader<AssetListItem>;
  /** Rendered above the form, for an entry point that lets the user choose the destination (Public or Platform). */
  topSlot?: ReactNode;
  onClose: () => void;
}

/** Creates an entity in the `public/` tree: the folder is chosen in the sidebar and the entity is versioned. */
const CreateAsset: FC<Props> = ({ view, isModalOpen, initialValues, context, topSlot, onClose }) => {
  const t = useI18n();
  const { isValid, dispatch } = useSaveValidationContext();
  const { showNotification } = useNotification();
  const router = useRouter();
  const folderContext = context?.();
  const filePath = folderContext?.filePath as string;
  const folderItems = folderContext?.fetchedFoldersData[filePath];
  const hasFetchError = folderContext?.hasFetchError;
  const names = filterNames(folderItems);
  // Stable per folder: AssetProperties re-validates the version whenever this changes.
  const versionsMap = useMemo(() => getVersionsPerName((folderItems ?? []) as AssetWithVersion[]), [folderItems]);
  const isLoadingFolder = folderItems == null && !hasFetchError;

  const [currentEntity, setCurrentEntity] = useState<DialResource>({
    ...initialValues,
    version: DEFAULT_NEW_ENTITY_VERSION,
  } as DialResource);

  const onSubmit = useCallback(async () => {
    const folderPath = (currentEntity.folderId as string) || `${ROOT_FOLDER}/`;
    // `DialResource` no longer declares the flat `AssetWithVersion` identity (`path` moved to the
    // merged read's `_metadata`, which a freshly created entity never has) — hence the double cast.
    const payload = {
      ...currentEntity,
      folderId: folderPath,
      ...(!isVersionlessAssetView(view) && { display_version: currentEntity.version }),
    } as unknown as AssetWithVersion;

    CreateAssetActionMap[view as CreateAssetRoute](payload).then((res) => {
      if (res.success) {
        folderContext?.fetchFiles(folderContext?.filePath);

        showNotification(
          getSuccessNotification(
            getCreateNotificationTitle(view, t),
            getCreateNotificationDescription(view, currentEntity.name, t),
          ),
        );
        const redirectEntity: Parameters<typeof getUrnForEntity>[1] = isVersionlessAssetView(view)
          ? { name: currentEntity.name, folderId: folderPath }
          : { name: currentEntity.name, version: currentEntity.version, folderId: folderPath };
        router.push(getUrnForEntity(view, redirectEntity));
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
      {topSlot && <div className="px-6 pt-4">{topSlot}</div>}
      <div className="flex flex-row px-6 py-4 h-full">
        <div className="flex flex-row gap-4 flex-1 min-h-0">
          <CollapsibleSidebar width={360} title={t(FoldersI18nKey.Folders)} className="border border-primary">
            <FolderList context={context} />
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
                // name against the new folder's population (each public folder holds its own names). The
                // version is re-checked by AssetProperties itself.
                key={filePath}
                view={view}
                entity={currentEntity as unknown as AssetWithVersion}
                onChangeEntity={onChangeEntity}
                names={names}
                versionsMap={versionsMap}
              />
            )}
          </div>
        </div>
      </div>
    </Popup>
  );
};

export default CreateAsset;
