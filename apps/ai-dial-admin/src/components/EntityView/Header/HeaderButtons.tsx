'use client';

import { Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';

import AssetVersionControl from '@/src/components/Assets/Deployments/AssetVersionControl';
import JsonToggleWithFormats from '@/src/components/EntityHeaderControls/JsonToggle/JsonToggleWithFormats';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ServerActionResponse } from '@/src/models/server-action';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ModifiedEntityButtons from './ModifiedEntityButtons';

interface Props<T> {
  view: ApplicationRoute;
  activeTab?: EntityViewTab;
  entity: T;
  isChanged: boolean;
  isEditorEnabled?: boolean;
  isHideJsonEditor?: boolean;
  addedVersions?: string[];
  setAddedVersions?: Dispatch<SetStateAction<string[]>>;
  selectedFormat?: ExportFormat;
  children?: ReactNode;
  assets?: AssetWithVersion[];
  etag?: string;

  onChangeEntity?: (entity: T) => void;
  onDiscard: () => void;
  onSave: (newVersion?: string) => void;
  onChangeSelectedFormat?: (format: ExportFormat) => void;
  onRemove: (entity: string) => Promise<ServerActionResponse>;
  onToggleEditor?: () => void;
  onHideFormatSelector?: () => boolean;
  getAssetContext?: () => AssetsFolderContext;
}

const HeaderButtons = <T extends object>({
  view,
  entity,
  onChangeEntity,
  isChanged,
  isEditorEnabled,
  isHideJsonEditor,
  children,
  addedVersions,
  setAddedVersions,
  getAssetContext,
  assets,
  etag,
  onDiscard,
  onSave,
  onRemove,
  ...props
}: Props<T>) => {
  const t = useI18n();
  const isSimple = isSimpleEntity(view);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const staticContainerClassName = 'flex flex-row gap-3 divide-x divide-primary lg:h-[35px]';

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [containerClassName, setContainerClassName] = useState(staticContainerClassName);
  const [buttonsClassName, setButtonsClassName] = useState('');

  const existingVersions = useMemo(() => {
    return assets?.map((asset) => asset.version) || [];
  }, [assets]);

  const isAssetView = useMemo(() => {
    return isAssetWithVersion(view);
  }, [view]);

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  useEffect(() => {
    setContainerClassName(
      classNames(
        staticContainerClassName,
        (isTablet || isMobile) && 'fixed bottom-0 left-0 right-0 h-[62px] bg-layer-3 px-6',
      ),
    );
    setButtonsClassName(classNames((isTablet || isMobile) && 'w-1/2 flex justify-center'));
  }, [isTablet, isMobile]);

  return (
    <>
      <div className={containerClassName}>
        {isChanged ? (
          <ModifiedEntityButtons
            entity={entity}
            onDiscard={onDiscard}
            onSave={onSave}
            view={view}
            isEditorEnabled={isEditorEnabled}
            existingVersions={existingVersions}
          />
        ) : (
          <div className="flex flex-row items-center w-full gap-x-4">
            {!isEditorEnabled && (
              <div className={classNames('flex-1 flex flex-row gap-x-4', isSimple && 'justify-center')}>
                {isAssetView && (
                  <AssetVersionControl
                    view={view}
                    asset={entity as AssetWithVersion}
                    addedVersions={addedVersions || []}
                    onChangeAddedVersion={setAddedVersions}
                    assets={assets}
                    onChangeAsset={onChangeEntity as (entity: AssetWithVersion) => void}
                    etag={etag}
                  />
                )}
                <div className={classNames('flex-1 flex flex-row gap-x-4', isSimple && 'justify-center')}>
                  <div className="flex flex-row gap-x-4">
                    <DialNeutralButton
                      className={classNames(buttonsClassName, isSimple && 'min-w-[150px] lg:min-w-0')}
                      label={t(ButtonsI18nKey.Delete)}
                      iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
                      onClick={onOpenModal}
                    />
                  </div>
                  {children}
                </div>
              </div>
            )}
            {!isHideJsonEditor && <JsonToggleWithFormats view={view} isEditorEnabled={isEditorEnabled} {...props} />}
          </div>
        )}
      </div>
      {isModalOpen &&
        createPortal(
          <DeleteConfirmationModal
            entity={entity}
            onRemoveEntity={onRemove}
            view={view}
            onCloseModal={onCloseModal}
            getAssetContext={getAssetContext}
            isSelectedView={true}
            existingVersions={existingVersions}
            etag={etag}
          />,
          document.body,
        )}
    </>
  );
};

export default HeaderButtons;
