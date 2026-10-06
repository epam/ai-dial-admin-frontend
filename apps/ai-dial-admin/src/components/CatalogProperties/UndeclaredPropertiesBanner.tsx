'use client';

import { DialNeutralButton, DialNotification, ElementSize, NotificationVariant } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import { FC } from 'react';

import { EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

interface Props {
  className?: string;
  names: string[];
  isForbidden: boolean;
  onRemove: () => void;
}

/**
 * Removal is offered only where the schema forbids the values, because only there do they block the
 * save; an allowed one is Core's to keep, and the JSON view still removes it by hand.
 */
const UndeclaredPropertiesBanner: FC<Props> = ({ className, names, isForbidden, onRemove }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const message = t(
    isForbidden ? EntitiesI18nKey.UndeclaredCatalogPropertiesForbidden : EntitiesI18nKey.UndeclaredCatalogProperties,
    { names: names.join(', ') },
  );

  return (
    <DialNotification
      className={className}
      variant={isForbidden ? NotificationVariant.Error : NotificationVariant.Warning}
      message={<span className="small">{message}</span>}
    >
      {isForbidden && !isReadOnlyAdmin && (
        <DialNeutralButton
          className="shrink-0"
          size={ElementSize.Small}
          label={t(EntitiesI18nKey.RemoveUndeclaredCatalogProperties)}
          iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
          onClick={onRemove}
        />
      )}
    </DialNotification>
  );
};

export default UndeclaredPropertiesBanner;
