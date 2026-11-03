import { FC } from 'react';
import { createPortal } from 'react-dom';

import { ConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, CustomDashboardsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  // The personal queries publishing copies into the dashboard, whose text every viewer will then see.
  queryNames: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

const PublishDashboardPopup: FC<Props> = ({ queryNames, onConfirm, onCancel }) => {
  const t = useI18n();

  return createPortal(
    <ConfirmationPopup
      open
      header={t(CustomDashboardsI18nKey.PublishTitle)}
      confirmLabel={t(CustomDashboardsI18nKey.PublishConfirm)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onConfirm={onConfirm}
      onClose={onCancel}
      onCancel={onCancel}
    >
      {/* Content replaces the popup's description, so the message is part of it. */}
      <div className="flex flex-col gap-2 dial-small-text">
        <p className="text-secondary">{t(CustomDashboardsI18nKey.PublishMessage)}</p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-primary">
          {queryNames.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    </ConfirmationPopup>,
    document.body,
  );
};

export default PublishDashboardPopup;
