'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';

import AssetVersionControl from '@/src/components/Assets/Deployments/AssetVersionControl';
import { showEditorErrorNotifications } from '@/src/components/EntityHeaderControls/Buttons/utils';
import JsonToggles from '@/src/components/EntityHeaderControls/JsonToggle/JsonToggle';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import AssetChangedEntityButtons from '../Buttons/AssetChangedEntityButtons';
import { SimpleButtonsWrapperProps } from './SimpleButtonsWrapper';

export interface AssetButtonsWrapperProps extends Omit<SimpleButtonsWrapperProps<AssetWithVersion>, 'onSave'> {
  assets?: AssetWithVersion[] | null;
  getAssetContext?: () => AssetsFolderContext;
  addedVersions?: string[];
  onChangeAsset?: (asset: AssetWithVersion) => void;
  onSave?: (version?: string) => void;
  onChangeAddedVersion?: (version: string[]) => void;
}

const AssetButtonsWrapper: FC<AssetButtonsWrapperProps> = ({
  view,
  entity,
  etag,
  jsonConfiguration,
  children,
  isChanged,
  onDiscard,
  onSave,
  onRemove,
  assets,
  getAssetContext,
  onChangeAddedVersion,
  addedVersions,
  onChangeAsset,
}) => {
  const t = useI18n();
  const isEditorEnabled = jsonConfiguration?.isEditorEnabled;
  const { dispatch, jsonErrors } = useSaveValidationContext();
  const { showNotification } = useNotification();

  const existingVersions = useMemo(() => {
    return assets?.map((asset) => asset.version) || [];
  }, [assets]);

  const staticContainerClassName = 'flex flex-row gap-3 divide-x divide-primary lg:h-[35px]';

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [containerClassName, setContainerClassName] = useState(staticContainerClassName);
  const [buttonsClassName, setButtonsClassName] = useState('');

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

  const onStartDiscard = useCallback(() => {
    dispatch({ type: ValidationActionType.Reset });

    onDiscard?.();
  }, [dispatch, onDiscard]);

  const onTryToSave = useCallback(
    (version?: string) => {
      if (jsonErrors?.length) {
        const errorNotifications = showEditorErrorNotifications(jsonErrors, showNotification, t);
        dispatch({ type: ValidationActionType.SetJsonEditorNotifications, errors: errorNotifications });
      } else {
        const isAddedVersion = !!addedVersions?.includes(entity.version);
        const newVersion = entity.version;
        onSave?.(version || (isAddedVersion ? newVersion : void 0));
      }
    },
    [jsonErrors, showNotification, t, dispatch, addedVersions, entity.version, onSave],
  );

  return (
    <>
      <div className={containerClassName}>
        {isChanged ? (
          <AssetChangedEntityButtons
            version={entity.version}
            existingVersions={existingVersions}
            onDiscard={onStartDiscard}
            isEditorEnabled={isEditorEnabled}
            onSave={onTryToSave}
          />
        ) : (
          <div className="flex flex-row items-center w-full gap-x-4">
            {!isEditorEnabled && (
              <div className="flex-1 flex flex-row gap-x-4 justify-center">
                <AssetVersionControl
                  view={view}
                  asset={entity}
                  addedVersions={addedVersions || []}
                  onChangeAddedVersion={onChangeAddedVersion}
                  assets={assets}
                  onChangeAsset={onChangeAsset}
                  etag={etag}
                />
                <DialNeutralButton
                  className={buttonsClassName}
                  label={t(ButtonsI18nKey.Delete)}
                  iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
                  onClick={onOpenModal}
                />
                {children}
              </div>
            )}
            <JsonToggles isEditorEnabled={isEditorEnabled} onToggleEditor={jsonConfiguration?.onToggleEditor} />
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

export default AssetButtonsWrapper;
