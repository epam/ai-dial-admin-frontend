'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';

import AddVersionModal from '@/src/components/Assets/Modals/AddVersionModal';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import { ButtonsI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { generateNewInitialVersion } from '@/src/utils/prompts/versions';

interface Props {
  version?: string;
  existingVersions?: string[];
  isEditorEnabled?: boolean;
  onDiscard: () => void;
  onSave: (newVersion?: string) => void;
}

const AssetChangedEntityButtons: FC<Props> = ({ version, isEditorEnabled, onDiscard, onSave, existingVersions }) => {
  const t = useI18n();

  const { isValid, dispatch } = useSaveValidationContext();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [buttonsClassName, setButtonsClassName] = useState('');

  const isDisableSave = useMemo(() => (isEditorEnabled ? false : !isValid), [isEditorEnabled, isValid]);

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
        disableSave={isDisableSave}
        saveLabel={t(ButtonsI18nKey.Save)}
      >
        <DialNeutralButton
          className={buttonsClassName}
          label={t(ButtonsI18nKey.SaveAsNewVersion)}
          onClick={() => setIsModalOpen(true)}
          disabled={isDisableSave}
        />
      </ChangedEntityButtons>

      {isModalOpen &&
        createPortal(
          <AddVersionModal
            heading={t(PromptsI18nKey.NewVersionSave)}
            isModalOpen={isModalOpen}
            prefilledVersion={generateNewInitialVersion(version)}
            existingVersions={existingVersions || []}
            onClose={() => setIsModalOpen(false)}
            onConfirm={onTryToSave}
          />,
          document.body,
        )}
    </>
  );
};

export default AssetChangedEntityButtons;
