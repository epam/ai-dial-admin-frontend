import { FC, useCallback, useState } from 'react';

import { Label, Popup, PopupSize } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import InputPopup from '@/src/components/Common/InputPopup/InputPopup';
import OverflowValueTooltip from '@/src/components/Common/OverflowValueTooltip/OverflowValueTooltip';
import { SKILLS_PREFIX } from '@/src/constants/publications-core';
import { BasicI18nKey, ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { SkillFolderProvider } from '@/src/context/assets/SkillFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { toSkillSelectPath } from '@/src/utils/files/path';
import SkillManager from './SkillManager';

interface Props {
  /** The skill reference, `skills/<bucket>/<path>`. */
  value: string;
  label?: string;
  elementId?: string;
  disabled?: boolean;
  inputClassName?: string;
  onChangeValue: (value: string) => void;
}

const SkillSelectInput: FC<Props> = ({ value, label, elementId, disabled, inputClassName, onChangeValue }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const [selectedSkillPath, setSelectedSkillPath] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const skillReference = toSkillSelectPath(value);

  const onConfirm = useCallback(() => {
    onChangeValue(selectedSkillPath ? `${SKILLS_PREFIX}${selectedSkillPath}` : '');
    setIsModalOpen(false);
  }, [onChangeValue, selectedSkillPath]);

  return (
    // Own provider so the popup's folder state is isolated from the Assets > Skills page.
    <SkillFolderProvider>
      <div className="flex flex-col gap-y-1">
        {label && <Label label={label} htmlFor={elementId} />}
        <OverflowValueTooltip text={skillReference}>
          <InputPopup
            disabled={disabled || isReadOnlyAdmin}
            open={isModalOpen}
            selectedValue={skillReference}
            onOpen={() => setIsModalOpen(true)}
            emptyValueText={t(BasicI18nKey.None)}
            inputClassName={inputClassName}
            editable
            onValueChange={onChangeValue}
          >
            <Popup
              header={t(TestSuitesI18nKey.SelectSkill)}
              portalId="skillSelect"
              open={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              className="md:h-[800px]"
              size={PopupSize.Lg}
              mainButtons={getFormPopupButtons({
                cancelLabel: t(ButtonsI18nKey.Cancel),
                submitLabel: t(ButtonsI18nKey.Confirm),
                isSubmitDisabled: !selectedSkillPath,
                onCancel: () => setIsModalOpen(false),
                onSubmit: onConfirm,
              })}
            >
              <div className="size-full min-h-0 overflow-hidden">
                <SkillManager
                  value={skillReference.slice(SKILLS_PREFIX.length)}
                  isModalOpen={isModalOpen}
                  onChangeSelectedSkillPath={setSelectedSkillPath}
                />
              </div>
            </Popup>
          </InputPopup>
        </OverflowValueTooltip>
      </div>
    </SkillFolderProvider>
  );
};

export default SkillSelectInput;
