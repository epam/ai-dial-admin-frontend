'use client';

import { Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';

import AssetVersionControl from '@/src/components/Assets/Deployments/AssetVersionControl';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { Asset } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { ServerActionResponse } from '@/src/models/server-action';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import ModifiedEntityButtons from './ModifiedEntityButtons';
import JsonToggles from '../../../EntityHeaderControls/JsonToggle/JsonToggle';

interface Props<T> {
  view: ApplicationRoute;
  isEditorEnabled?: boolean;
  onChangeEntity?: (entity: T) => void;
  onDiscard: () => void;
  onSave: (newVersion?: string) => void;
  onChangeSelectedFormat?: (format: ExportFormat) => void;
  onRemove: (entity: string) => Promise<ServerActionResponse>;
  onToggleJsonEditor?: () => void;
  onHideFormatSelector?: () => void;
  getAssetContext?: () => AssetsFolderContext<DialFile>;
}

const ButtonsSection = <T extends object>({
  view,
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
  const staticContainerClassName = 'flex flex-row gap-3 divide-x divide-primary lg:h-[35px]';

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [containerClassName, setContainerClassName] = useState(staticContainerClassName);

  useEffect(() => {
    setContainerClassName(
      classNames(
        staticContainerClassName,
        (isTablet || isMobile) && 'fixed bottom-0 left-0 right-0 h-[62px] bg-layer-3 px-6',
      ),
    );
  }, [isTablet, isMobile]);

  return (
    <>
      <div className={containerClassName}>
        {!isHideJsonEditor && <JsonToggles view={view} isEditorEnabled={isEditorEnabled} {...props} />}
      </div>
    </>
  );
};

export default ButtonsSection;
