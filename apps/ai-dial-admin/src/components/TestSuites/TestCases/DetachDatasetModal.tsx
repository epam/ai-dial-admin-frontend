'use client';

import { FC, useMemo, useState } from 'react';

import { Popup, PopupSize, RadioButtonWithContent, RadioGroup, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { DatasetDetachMode } from '@/src/types/evaluation';
import { toRadioItems } from '@/src/utils/radio-items';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: DatasetDetachMode) => void;
}

const DetachDatasetModal: FC<Props> = ({ isOpen, onClose, onConfirm }) => {
  const t = useI18n();
  const [mode, setMode] = useState(DatasetDetachMode.KEEP_TEST_CASES);

  const options: RadioButtonWithContent[] = useMemo(
    () => [
      {
        id: DatasetDetachMode.KEEP_TEST_CASES,
        name: t(TestSuitesI18nKey.DetachKeepTestCases),
        caption: t(TestSuitesI18nKey.DetachKeepTestCasesDescription),
      },
      {
        id: DatasetDetachMode.START_EMPTY,
        name: t(TestSuitesI18nKey.DetachStartEmpty),
        caption: t(TestSuitesI18nKey.DetachStartEmptyDescription),
      },
    ],
    [t],
  );

  return (
    <Popup
      open={isOpen}
      header={t(TestSuitesI18nKey.DetachFromDataset)}
      portalId="DetachDatasetModal"
      size={PopupSize.Md}
      onClose={onClose}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Confirm),
        onCancel: onClose,
        onSubmit: () => onConfirm(mode),
      })}
    >
      <div className="px-6 py-4">
        <RadioGroup
          orientation={RadioGroupOrientation.Column}
          items={toRadioItems(options)}
          value={mode}
          id="detach-mode"
          onChange={(value) => setMode(value as DatasetDetachMode)}
        />
      </div>
    </Popup>
  );
};

export default DetachDatasetModal;
