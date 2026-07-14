import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';

import { DialCollapsibleSidebar, DialFormPopup, DialLabelledText, DialLoader, PopupSize } from '@epam/ai-dial-ui-kit';

import { getVersionsPerName } from '@/src/components/Assets/utils';
import FolderList from '@/src/components/Common/FolderList/FolderList';
import AssetProperties from '@/src/components/EntityMainProperties/Properties/AssetProperties';
import { ButtonsI18nKey, EntitiesI18nKey, EntityFieldsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { DEFAULT_NEW_ENTITY_VERSION } from '@/src/constants/dial-base-entity';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getCreateEntityTitle,
  getCreateNotificationDescription,
  getCreateNotificationTitle,
} from '@/src/utils/entities/create-entity';
import { filterNames } from '@/src/utils/entities/filter-names';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { DialResource } from '@/src/models/dial/resource';

interface Props {
  view: ApplicationRoute;
  isModalOpen: boolean;
  initialValues?: Partial<AssetWithVersion>;
  context?: () => AssetsFolderContext;
  onClose: () => void;
  onCreate: (entity: DialResource) => Promise<ServerActionResponse>;
}

const CreateAsset: FC<Props> = ({ view, isModalOpen, initialValues, context, onCreate, onClose }) => {
  const t = useI18n();
  const { isValid, dispatch } = useSaveValidationContext();
  const { showNotification } = useNotification();
  const router = useRouter();
  const folderContext = context?.();
  const filePath = folderContext?.filePath as string;
  const data = folderContext?.data || [];
  const names = filterNames(data);
  const versionsMap = getVersionsPerName(data as AssetWithVersion[]);

  const [currentEntity, setCurrentEntity] = useState<DialResource>({
    ...initialValues,
    version: DEFAULT_NEW_ENTITY_VERSION,
  } as DialResource);

  const onSubmit = useCallback(async () => {
    onCreate(currentEntity).then((res) => {
      if (res.success) {
        folderContext?.fetchFiles(folderContext?.filePath);

        showNotification(
          getSuccessNotification(
            getCreateNotificationTitle(view, t),
            getCreateNotificationDescription(view, currentEntity.name, t),
          ),
        );
        const originalRoute = view.split('/')[1];
        router.push(
          `${initialValues ? '/' : ''}${originalRoute}/${getEntityPath(view, res.response || currentEntity)}`,
        );
        onClose();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
      }
    });
  }, [folderContext, currentEntity, initialValues, onClose, onCreate, router, showNotification, t, view]);

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
            <FolderList context={context} />
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
                entity={currentEntity as AssetWithVersion}
                onChangeEntity={onChangeEntity}
                names={names}
                versionsMap={versionsMap}
                initialValues={initialValues}
              />
            )}
          </div>
        </div>
      </div>
    </DialFormPopup>
  );
};

export default CreateAsset;
