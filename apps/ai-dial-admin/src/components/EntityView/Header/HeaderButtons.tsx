'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';

import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { ServerActionResponse } from '@/src/models/server-action';
import { ExportFormat } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { isSimpleEntity } from '@/src/utils/entities/is-simple-entity';
import { EntityViewTab } from '@/src/utils/tabs/utils';
import JsonToggles from './JsonToggle';
import ModifiedEntityButtons from './ModifiedEntityButtons';

interface Props<T> {
  view: ApplicationRoute;
  activeTab?: EntityViewTab;
  entity: T;
  isChanged: boolean;
  jsonEditorEnabled: boolean;
  hideJsonEditor?: boolean;
  existingVersions?: string[];
  selectedFormat?: ExportFormat;
  setSelectedFormat?: (format: ExportFormat) => void;
  children?: ReactNode;
  onDiscard: () => void;
  onSave: (newVersion?: string) => void;
  removeEntity: (entity: string) => Promise<ServerActionResponse>;
  toggleJsonEditor?: () => void;
  context?: () => AssetsFolderContext<DialFile>;
  childrenContainerClass?: string;
}

const HeaderButtons = <T extends object>({
  view,
  entity,
  isChanged,
  onDiscard,
  onSave,
  removeEntity,
  jsonEditorEnabled,
  hideJsonEditor,
  children,
  existingVersions,
  context,
  childrenContainerClass,
  ...props
}: Props<T>) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const isSimple = isSimpleEntity(view);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const staticContainerClassnames = 'flex flex-row gap-3 divide-x divide-primary lg:h-[35px]';

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [containerClassNames, setContainerClassNames] = useState(staticContainerClassnames);
  const [buttonsClassNames, setButtonsClassNames] = useState('');

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  useEffect(() => {
    setContainerClassNames(
      classNames(
        staticContainerClassnames,
        isTablet || isMobile ? 'fixed bottom-0 left-0 right-0 h-[62px] bg-layer-3 px-6' : '',
      ),
    );
    setButtonsClassNames(classNames(isTablet || isMobile ? 'w-1/2 flex justify-center' : ''));
  }, [isTablet, isMobile]);

  return (
    <>
      <div className={containerClassNames}>
        {isChanged ? (
          <ModifiedEntityButtons
            entity={entity}
            onDiscard={onDiscard}
            onSave={onSave}
            view={view}
            jsonEditorEnabled={jsonEditorEnabled}
            existingVersions={existingVersions}
          />
        ) : (
          <div className="flex flex-row items-center w-full gap-x-3">
            {!jsonEditorEnabled && (
              <div
                className={classNames(
                  `flex-1 flex flex-row gap-3`,
                  childrenContainerClass,
                  isSimple ? 'justify-center' : '',
                )}
              >
                <DialButton
                  variant={ButtonVariant.Secondary}
                  cssClass={classNames(buttonsClassNames, isSimple ? 'min-w-[150px] lg:min-w-0' : '')}
                  title={t(ButtonsI18nKey.Delete)}
                  iconBefore={<IconTrashX {...BASE_ICON_PROPS} />}
                  onClick={onOpenModal}
                />
                {children}
              </div>
            )}
            {!hideJsonEditor && <JsonToggles view={view} jsonEditorEnabled={jsonEditorEnabled} {...props} />}
          </div>
        )}
      </div>
      {isModalOpen &&
        createPortal(
          <DeleteConfirmationModal
            entity={entity}
            removeEntity={removeEntity}
            view={view}
            onCloseModal={onCloseModal}
            context={context}
            isSelectedView={true}
          />,
          document.body,
        )}
    </>
  );
};

export default HeaderButtons;
