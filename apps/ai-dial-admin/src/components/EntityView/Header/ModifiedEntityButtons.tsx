'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import AddVersionModal from '@/src/components/Assets/Modals/AddVersionModal';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { ButtonsI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';
import { generateNewInitialVersion } from '@/src/utils/prompts/versions';
import { showEditorErrorNotifications } from '@/src/components/EntityHeaderControls/Buttons/utils';

interface Props {
  view: ApplicationRoute;
  entity: { version?: string };
  existingVersions?: string[];
  isEditorEnabled?: boolean;
  onDiscard: () => void;
  onSave: (newVersion?: string) => void;
}

const ModifiedEntityButtons: FC<Props> = ({ view, entity, isEditorEnabled, onDiscard, onSave, existingVersions }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const { isValid, jsonErrors, dispatch } = useSaveValidationContext();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [buttonsClassName, setButtonsClassName] = useState('');

  const isDisableSave = useMemo(() => (isEditorEnabled ? false : !isValid), [isEditorEnabled, isValid]);

  const onTryToSave = useCallback(
    (newVersion?: string) => {
      if (newVersion) {
        setIsModalOpen(false);
      }

      if (jsonErrors?.length) {
        const errorNotifications = showEditorErrorNotifications(jsonErrors, showNotification, t);
        dispatch({ type: ValidationActionType.SetJsonEditorNotifications, errors: errorNotifications });
      } else {
        onSave(newVersion);
      }
    },
    [jsonErrors, showNotification, t, dispatch, onSave],
  );

  useEffect(() => {
    setButtonsClassName(classNames((isTablet || isMobile) && 'w-1/2 flex justify-center'));
  }, [isTablet, isMobile]);

  return (
    <>
      <ChangedEntityButtons
        onDiscard={onDiscard}
        onSave={onTryToSave}
        disableSave={isDisableSave}
        saveLabel={t(ButtonsI18nKey.Save)}
      >
        {isAssetWithVersion(view) && (
          <DialNeutralButton
            className={buttonsClassName}
            label={t(ButtonsI18nKey.SaveAsNewVersion)}
            onClick={() => setIsModalOpen(true)}
            disabled={isDisableSave}
          />
        )}
      </ChangedEntityButtons>

      {isModalOpen &&
        createPortal(
          <AddVersionModal
            heading={t(PromptsI18nKey.NewVersionSave)}
            isModalOpen={isModalOpen}
            prefilledVersion={generateNewInitialVersion(entity.version)}
            existingVersions={existingVersions || []}
            onClose={() => setIsModalOpen(false)}
            onConfirm={onTryToSave}
          />,
          document.body,
        )}
    </>
  );
};

export default ModifiedEntityButtons;
