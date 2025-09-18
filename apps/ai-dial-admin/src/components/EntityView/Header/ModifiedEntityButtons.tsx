'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import { showEditorErrorNotifications } from '@/src/components/EntityView/JsonEditor/utils';
import AddVersionModal from '@/src/components/PromptView/Modals/AddVersionModal';
import { ButtonsI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { JSONEditorError } from '@/src/types/editor';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { generateNewInitialVersion } from '@/src/utils/prompts/versions';
import { DialPrompt } from '@/src/models/dial/prompt';

interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  promptVersions?: string[];
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
  promptVersions,
}: Props<T>) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const { showNotification } = useNotification();

  const { isValid, jsonErrors, dispatch } = useSaveValidationContext();

  const [versionModalState, setVersionModalState] = useState(PopUpState.Closed);

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [buttonsClassNames, setButtonsClassNames] = useState('');

  const onTryToSave = useCallback(
    (newVersion?: string) => {
      if (newVersion) {
        setVersionModalState(PopUpState.Closed);
      }

      if (jsonErrors?.length) {
        const errors = jsonErrors as JSONEditorError[];
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
        <Button
          cssClass={classNames('secondary', buttonsClassNames)}
          title={t(ButtonsI18nKey.Discard)}
          onClick={onDiscard}
        />
        {view === ApplicationRoute.Prompts && (
          <Button
            cssClass={classNames('secondary', buttonsClassNames)}
            title={t(ButtonsI18nKey.SaveAsNewVersion)}
            onClick={() => setVersionModalState(PopUpState.Opened)}
            disable={jsonEditorEnabled ? false : !isValid}
          />
        )}
        <Button
          cssClass={classNames('primary', buttonsClassNames)}
          title={t(ButtonsI18nKey.Save)}
          onClick={() => onTryToSave()}
          disable={jsonEditorEnabled ? false : !isValid}
        />
      </div>
      {versionModalState === PopUpState.Opened &&
        createPortal(
          <AddVersionModal
            heading={t(PromptsI18nKey.NewVersionSave)}
            modalState={versionModalState}
            prefilledVersion={generateNewInitialVersion((entity as DialPrompt).version)}
            existingVersions={promptVersions || []}
            onClose={() => setVersionModalState(PopUpState.Closed)}
            onConfirm={onTryToSave}
          />,
          document.body,
        )}
    </>
  );
};

export default ModifiedEntityButtons;
