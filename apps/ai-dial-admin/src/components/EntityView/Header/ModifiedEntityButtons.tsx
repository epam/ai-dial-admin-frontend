'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'classnames';

import Button from '@/src/components/Common/Button/Button';
import { showEditorErrorNotifications } from '@/src/components/JSONEditor/JSONEditor.utils';
import AddVersionModal from '@/src/components/PromptView/Modals/AddVersionModal';
import { ButtonsI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { DialBaseEntity } from '@/src/models/dial/base-entity';
import { DialKey } from '@/src/models/dial/key';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { generateNewInitialVersion } from '@/src/utils/prompts/versions';

interface Props<T> {
  view: ApplicationRoute;
  entity: T;
  jsonEditorEnabled: boolean;
  onDiscard: () => void;
  onSave: (newVersion?: string) => void;
  setErrorNotifications?: (notification: JSONEditorErrorNotification[]) => void;
  contentJsonErrors?: JSONEditorError[] | null;
  promptVersions?: string[];
}

const ModifiedEntityButtons = <T extends DialBaseEntity | DialKey>({
  view,
  entity,
  onDiscard,
  onSave,
  jsonEditorEnabled,
  setErrorNotifications,
  contentJsonErrors,
  promptVersions,
}: Props<T>) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const { showNotification } = useNotification();

  const { isValid, jsonErrors } = useSaveValidationContext();

  const [versionModalState, setVersionModalState] = useState(PopUpState.Closed);
  const [isValidJSON, setIsValidJSON] = useState<boolean>(true);

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [buttonsClassNames, setButtonsClassNames] = useState('');

  useEffect(() => {
    setIsValidJSON(!jsonErrors?.length);
  }, [jsonErrors]);

  const onTryToSave = useCallback(
    (newVersion?: string) => {
      if (newVersion) {
        setVersionModalState(PopUpState.Closed);
      }
      if (jsonErrors?.length || contentJsonErrors?.length) {
        setIsValidJSON(false);
        const errors = (jsonErrors?.length ? jsonErrors : contentJsonErrors) as JSONEditorError[];
        const errorNotifications = showEditorErrorNotifications({
          errors,
          showNotification,
          t,
        });
        setErrorNotifications?.(errorNotifications);
      } else {
        onSave(newVersion);
      }
    },
    [jsonErrors, contentJsonErrors, showNotification, t, setErrorNotifications, onSave],
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
            disable={(jsonEditorEnabled && !!jsonErrors?.length) || !isValid}
          />
        )}
        <Button
          cssClass={classNames('primary', buttonsClassNames)}
          title={t(ButtonsI18nKey.Save)}
          onClick={() => onTryToSave()}
          disable={(jsonEditorEnabled && !!jsonErrors?.length) || !isValid}
        />
      </div>
      {versionModalState === PopUpState.Opened &&
        createPortal(
          <AddVersionModal
            heading={t(PromptsI18nKey.NewVersionSave)}
            modalState={versionModalState}
            prefilledVersion={generateNewInitialVersion(entity.version)}
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
