'use client';

import { Popup } from '@epam/ai-dial-ui-kit';

import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import { FC } from 'react';

import { useI18n } from '@/src/locales/client';
import { ButtonsI18nKey } from '@/src/constants/i18n';

interface Props {
  isModalOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
}

const AddTestCase: FC<Props> = ({ isModalOpen, onClose, onAdd }) => {
  const t = useI18n();
  // TODO: add implementation of add test case form
  return (
    <Popup
      onClose={onClose}
      header="add test case"
      portalId="AddTestCase"
      className="md:h-[660px]"
      open={isModalOpen}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel: t(ButtonsI18nKey.Add),
        onCancel: onClose,
        onSubmit: onAdd,
      })}
    >
      <div className="flex px-6 py-4 h-full flex-col">Add Test Case Form</div>
    </Popup>
  );
};

export default AddTestCase;
