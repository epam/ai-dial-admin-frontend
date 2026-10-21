import { FC } from 'react';
import { createPortal } from 'react-dom';

import { ConfirmationPopupVariant, DialConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QueryBuilderView } from '@/src/models/analytics/query-builder';

interface Props {
  destination: QueryBuilderView;
  onConfirm: () => void;
  onCancel: () => void;
}

// Why the written query has to go depends on where the user is going: the Builder cannot display it,
// while the JSON view could have — what failed there is the translation. No other destination reaches
// this popup, so the Builder wording is the fallback.
const DESCRIPTION_I18N: Partial<Record<QueryBuilderView, QueryBuilderI18nKey>> = {
  [QueryBuilderView.Json]: QueryBuilderI18nKey.DiscardQueryDescriptionJson,
};

// Guards switching out of a written mode (SQL, diverged JSON): the written query cannot survive the
// switch, so confirming drops it and resets the builder to its starting point.
const DiscardQueryPopup: FC<Props> = ({ destination, onConfirm, onCancel }) => {
  const t = useI18n();

  return createPortal(
    <DialConfirmationPopup
      variant={ConfirmationPopupVariant.Danger}
      open={true}
      header={t(QueryBuilderI18nKey.DiscardQueryHeader)}
      description={t(DESCRIPTION_I18N[destination] ?? QueryBuilderI18nKey.DiscardQueryDescriptionBuilder)}
      confirmLabel={t(ButtonsI18nKey.Discard)}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      onConfirm={onConfirm}
      onClose={onCancel}
      onCancel={onCancel}
    />,
    document.body,
  );
};

export default DiscardQueryPopup;
