'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';

import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { showEditorErrorNotifications } from '@/src/components/EntityHeaderControls/Buttons/utils';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { Asset } from '@/src/models/dial/deployment-asset';
import AssetVersionControl from '@/src/components/Assets/Deployments/AssetVersionControl';
import JsonToggles from '../JsonToggle/JsonToggle';
import { SimpleButtonsWrapperProps } from './SimpleButtonsWrapper';

export interface AssetButtonsWrapperProps extends SimpleButtonsWrapperProps<Asset> {
  assets?: Asset[];
  getAssetContext?: () => AssetsFolderContext<Asset>;
  addedVersions?: string[];
  onChangeAsset?: (asset: Asset) => void;
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
  const { isEditorEnabled } = jsonConfiguration;
  const { isValid, dispatch, jsonErrors } = useSaveValidationContext();
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
  const isDisableSave = useMemo(() => (isEditorEnabled ? false : !isValid), [isEditorEnabled, isValid]);

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

  const onTryToSave = useCallback(() => {
    if (jsonErrors?.length) {
      const errorNotifications = showEditorErrorNotifications(jsonErrors, showNotification, t);
      dispatch({ type: ValidationActionType.SetJsonEditorNotifications, errors: errorNotifications });
    } else {
      onSave?.();
    }
  }, [jsonErrors, showNotification, t, dispatch, onSave]);

  return (
    <>
      <div className={containerClassName}>
        {isChanged ? (
          <ChangedEntityButtons disableSave={isDisableSave} onDiscard={onStartDiscard} onSave={onTryToSave} />
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
            <JsonToggles isEditorEnabled={isEditorEnabled} onToggleEditor={jsonConfiguration.onToggleEditor} />
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
