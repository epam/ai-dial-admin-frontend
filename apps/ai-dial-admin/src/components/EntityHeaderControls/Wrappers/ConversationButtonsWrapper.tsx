'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { ButtonAppearance, DialDangerButton } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';

import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import {
  BASE_BUTTON_ICON_PROPS,
  SELECT_ENTITY_HEADER_CLASS,
  SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS,
  SELECT_ENTITY_MOBILE_HEADER_CLASS,
} from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';

export interface ConversationButtonsWrapperProps<T> {
  view: ApplicationRoute;
  children?: ReactNode;
  entity: T;
  etag?: string;
  getAssetContext?: () => AssetsFolderContextReader<AssetListItem>;

  onRemove: (entity: string) => Promise<ServerActionResponse>;
}

const ConversationButtonsWrapper = <T extends object>({
  view,
  entity,
  etag,
  children,
  onRemove,
  getAssetContext,
}: ConversationButtonsWrapperProps<T>) => {
  const t = useI18n();
  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [containerClassName, setContainerClassName] = useState(SELECT_ENTITY_HEADER_CLASS);
  const [buttonsClassName, setButtonsClassName] = useState('');

  const onOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  useEffect(() => {
    setContainerClassName(
      classNames(SELECT_ENTITY_HEADER_CLASS, (isTablet || isMobile) && SELECT_ENTITY_MOBILE_HEADER_CLASS),
    );
    setButtonsClassName(classNames((isTablet || isMobile) && SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS));
  }, [isTablet, isMobile]);

  return (
    <>
      <div className={containerClassName}>
        <div className="flex flex-row items-center w-full gap-x-4">
          <div className="flex-1 flex flex-row gap-x-4 justify-center">
            <DialDangerButton
              className={buttonsClassName}
              label={t(ButtonsI18nKey.Delete)}
              appearance={ButtonAppearance.Outlined}
              iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
              onClick={onOpenModal}
            />
            {children}
          </div>
        </div>
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
            etag={etag}
          />,
          document.body,
        )}
    </>
  );
};

export default ConversationButtonsWrapper;
