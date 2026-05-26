'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  ButtonAppearance,
  DialErrorButton,
  DialLoader,
  DialSelect,
  SelectSize,
  SelectVariant,
} from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';

import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { ButtonsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import {
  BASE_BUTTON_ICON_PROPS,
  SELECT_ENTITY_HEADER_CLASS,
  SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS,
  SELECT_ENTITY_MOBILE_HEADER_CLASS,
} from '@/src/constants/main-layout';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';

export interface ConversationButtonsWrapperProps<T> {
  view: ApplicationRoute;
  children?: ReactNode;
  entity: T;
  etag?: string;
  version?: string;
  versions?: string[];
  isVersionLoading?: boolean;
  onVersionChange?: (version: string) => void;

  onRemove: (entity: string) => Promise<ServerActionResponse>;
}

const ConversationButtonsWrapper = <T extends object>({
  view,
  entity,
  etag,
  children,
  onRemove,
  version,
  versions,
  isVersionLoading,
  onVersionChange,
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

  const versionsOptions = useMemo(() => {
    return versions?.map((v) => ({ value: v, label: v })) || [];
  }, [versions]);

  return (
    <>
      <div className={containerClassName}>
        <div className="flex flex-row items-center w-full gap-x-4">
          <div className="flex-1 flex flex-row gap-x-4 justify-center">
            <div className="flex items-center gap-2">
              <DialSelect
                prefix={`${t(EntityFieldsI18nKey.version)}: `}
                size={SelectSize.Sm}
                variant={SelectVariant.Secondary}
                options={versionsOptions}
                value={version}
                onChange={(v) => onVersionChange?.(v as string)}
                disabled={isVersionLoading}
              />
              {isVersionLoading && <DialLoader fullWidth={false} size={16} />}
            </div>
            <DialErrorButton
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
            isSelectedView={true}
            etag={etag}
          />,
          document.body,
        )}
    </>
  );
};

export default ConversationButtonsWrapper;
