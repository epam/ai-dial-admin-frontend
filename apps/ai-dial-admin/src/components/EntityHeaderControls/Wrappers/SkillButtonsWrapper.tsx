'use client';

import { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { ButtonAppearance, DialDangerButton } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';

import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import DeleteConfirmationModal from '@/src/components/EntityView/Modals/Delete/Delete';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import {
  BASE_BUTTON_ICON_PROPS,
  SELECT_ENTITY_HEADER_CLASS,
  SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS,
  SELECT_ENTITY_MOBILE_HEADER_CLASS,
} from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { DialSkillResource } from '@/src/models/dial/resource';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';

export interface SkillButtonsWrapperProps {
  view: ApplicationRoute;
  entity: DialSkillResource;
  etag?: string;
  isChanged: boolean;
  children?: ReactNode;
  getAssetContext?: () => AssetsFolderContext;
  onDiscard: () => void;
  onSave: () => void;
  onRemove: (entity: string) => Promise<ServerActionResponse>;
}

/**
 * `AssetButtonsWrapper`'s Save/Discard + Delete shape, minus the version control it renders
 * unconditionally (`AssetVersionControl` always shows a "Version" dropdown, and its "Create" footer
 * hardcodes `getApp`/`getToolset`/`getPrompt` — none of which apply to Skill, which has no version
 * concept exposed at this layer). `ConversationButtonsWrapper` is the precedent for this kind of
 * narrower, type-specific wrapper rather than forcing a shared component into an ill-fitting shape.
 */
const SkillButtonsWrapper: FC<SkillButtonsWrapperProps> = ({
  view,
  entity,
  etag,
  children,
  isChanged,
  onDiscard,
  onSave,
  onRemove,
  getAssetContext,
}) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { dispatch } = useSaveValidationContext();

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [containerClassName, setContainerClassName] = useState(SELECT_ENTITY_HEADER_CLASS);
  const [buttonsClassName, setButtonsClassName] = useState('');

  const onOpenModal = useCallback(() => setIsModalOpen(true), []);
  const onCloseModal = useCallback(() => setIsModalOpen(false), []);

  useEffect(() => {
    setContainerClassName(
      classNames(SELECT_ENTITY_HEADER_CLASS, (isTablet || isMobile) && SELECT_ENTITY_MOBILE_HEADER_CLASS),
    );
    setButtonsClassName(classNames((isTablet || isMobile) && SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS));
  }, [isTablet, isMobile]);

  const onStartDiscard = useCallback(() => {
    dispatch({ type: ValidationActionType.Reset });
    onDiscard();
  }, [dispatch, onDiscard]);

  return (
    <>
      <div className={containerClassName}>
        {isReadOnlyAdmin ? null : isChanged ? (
          <ChangedEntityButtons onDiscard={onStartDiscard} onSave={onSave} saveLabel={t(ButtonsI18nKey.Save)} />
        ) : (
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
            etag={etag}
          />,
          document.body,
        )}
    </>
  );
};

export default SkillButtonsWrapper;
