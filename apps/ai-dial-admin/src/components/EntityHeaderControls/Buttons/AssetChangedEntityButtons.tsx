'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { OutlinedButton } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import AddVersionModal from '@/src/components/Assets/Modals/AddVersionModal';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { ButtonsI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';

interface Props {
  version?: string;
  entityName?: string;
  existingVersions?: Record<string, string[]>;
  isEditorEnabled?: boolean;
  isAddedVersion?: boolean;
  /** Versionless views (prompt/conversation) have no save-as-new-version flow. */
  isVersionlessView?: boolean;
  isSaving?: boolean;
  /** Disables Save only; Save as new version stays on the entity path and is unaffected. */
  isSaveDisabled?: boolean;
  onDiscard: () => void;
  onSave: (newVersion?: string) => void;
}

const AssetChangedEntityButtons: FC<Props> = ({
  isEditorEnabled,
  onDiscard,
  onSave,
  existingVersions,
  entityName,
  isAddedVersion,
  isVersionlessView,
  isSaving,
  isSaveDisabled,
}) => {
  const t = useI18n();

  const { isValid, dispatch } = useSaveValidationContext();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [buttonsClassName, setButtonsClassName] = useState('');

  const isDisableSave = useMemo(
    () => (isEditorEnabled ? false : !isValid || !!isSaving),
    [isEditorEnabled, isValid, isSaving],
  );

  const onStartDiscard = useCallback(() => {
    dispatch({ type: ValidationActionType.Reset });

    onDiscard?.();
  }, [dispatch, onDiscard]);

  const onTryToSave = useCallback(
    (newVersion?: string) => {
      if (newVersion) {
        setIsModalOpen(false);
      }

      onSave(newVersion);
    },
    [onSave],
  );

  useEffect(() => {
    setButtonsClassName(classNames((isTablet || isMobile) && 'w-1/2 flex justify-center'));
  }, [isTablet, isMobile]);

  return (
    <>
      <ChangedEntityButtons
        onDiscard={onStartDiscard}
        onSave={onTryToSave}
        disableSave={isDisableSave || !!isSaveDisabled}
        saveLabel={t(ButtonsI18nKey.Save)}
      >
        {!isAddedVersion && !isVersionlessView && (
          <OutlinedButton
            className={buttonsClassName}
            label={t(ButtonsI18nKey.SaveAsNewVersion)}
            onClick={() => setIsModalOpen(true)}
            disabled={isDisableSave}
          />
        )}
      </ChangedEntityButtons>

      {isModalOpen &&
        !isVersionlessView &&
        createPortal(
          <AddVersionModal
            header={t(PromptsI18nKey.NewVersionSave)}
            description={t(PromptsI18nKey.NewVersionSaveDescription)}
            isModalOpen={isModalOpen}
            existingVersions={existingVersions}
            onClose={() => setIsModalOpen(false)}
            onConfirm={onTryToSave}
            entityName={entityName}
          />,
          document.body,
        )}
    </>
  );
};

export default AssetChangedEntityButtons;
