'use client';

import { DialFormPopup } from '@epam/ai-dial-ui-kit';
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
  return (
    <DialFormPopup
      onClose={onClose}
      header={'AddTestCase'}
      portalId="AddTestCase"
      className="h-[660px]"
      open={isModalOpen}
      onSubmit={onAdd}
      onCancel={onClose}
      submitLabel={t(ButtonsI18nKey.Add)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
    >
      <div className="flex px-6 py-4 h-full flex-col">Add Test Case Form</div>
    </DialFormPopup>
  );
};

export default AddTestCase;
