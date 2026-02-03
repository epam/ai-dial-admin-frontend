'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import AddVersionModal from '@/src/components/Assets/Modals/AddVersionModal';
import { showEditorErrorNotifications } from '@/src/components/EntityView/JsonEditor/utils';
import { ButtonsI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';
import { generateNewInitialVersion } from '@/src/utils/prompts/versions';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';

interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  existingVersions?: string[];
  isJsonEditorEnabled?: boolean;
  onDiscard: () => void;
  onSave: (newVersion?: string) => void;
}

const ModifiedEntityButtons = <T extends object>({
  view,
  entity,
  isJsonEditorEnabled,
  onDiscard,
  onSave,
  existingVersions,
}: Props<T>) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const { isValid, jsonErrors, dispatch } = useSaveValidationContext();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [buttonsClassName, setButtonsClassName] = useState('');

  const isDisableSave = useMemo(() => (isJsonEditorEnabled ? false : !isValid), [isJsonEditorEnabled, isValid]);

  const onTryToSave = useCallback(
    (newVersion?: string) => {
      if (newVersion) {
        setIsModalOpen(false);
      }

      if (jsonErrors?.length) {
        const errors = jsonErrors;
        const errorNotifications = showEditorErrorNotifications({
          errors,
          showNotification,
          t,
        });
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
            prefilledVersion={generateNewInitialVersion((entity as DialPrompt).version)}
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
