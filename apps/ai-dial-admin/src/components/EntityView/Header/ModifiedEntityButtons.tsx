'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';

import AddVersionModal from '@/src/components/Assets/Prompts/Modals/AddVersionModal';
import { showEditorErrorNotifications } from '@/src/components/EntityView/JsonEditor/utils';
import { ButtonsI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ApplicationRoute } from '@/src/types/routes';
import { generateNewInitialVersion } from '@/src/utils/prompts/versions';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';

interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  existingVersions?: string[];
  jsonEditorEnabled?: boolean;
  onDiscard: () => void;
  onSave: (newVersion?: string) => void;
}

const ModifiedEntityButtons = <T extends object>({
  view,
  entity,
  jsonEditorEnabled,
  onDiscard,
  onSave,
  existingVersions,
}: Props<T>) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const { showNotification } = useNotification();

  const { isValid, jsonErrors, dispatch } = useSaveValidationContext();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [buttonsClassNames, setButtonsClassNames] = useState('');

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
    setButtonsClassNames(classNames(isTablet || isMobile ? 'w-1/2 flex justify-center' : ''));
  }, [isTablet, isMobile]);

  return (
    <>
      <div className="flex flex-row gap-3 w-full p-3 lg:p-0">
        <DialButton
          variant={ButtonVariant.Secondary}
          cssClass={buttonsClassNames}
          title={t(ButtonsI18nKey.Discard)}
          onClick={onDiscard}
        />
        {isAssetWithVersion(view) && (
          <DialButton
            variant={ButtonVariant.Secondary}
            cssClass={buttonsClassNames}
            title={t(ButtonsI18nKey.SaveAsNewVersion)}
            onClick={() => setIsModalOpen(true)}
            disable={jsonEditorEnabled ? false : !isValid}
          />
        )}
        <DialButton
          variant={ButtonVariant.Primary}
          cssClass={buttonsClassNames}
          title={t(ButtonsI18nKey.Save)}
          onClick={() => onTryToSave()}
          disable={jsonEditorEnabled ? false : !isValid}
        />
      </div>
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
