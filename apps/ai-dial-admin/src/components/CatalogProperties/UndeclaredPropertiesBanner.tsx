'use client';

/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- the scrollable message must be keyboard accessible. */

import { Notification, NotificationType, ElementSize, NotificationVariant } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import RemoveButton from '@/src/components/Common/RemoveButton/RemoveButton';
import { EntitiesI18nKey } from '@/src/constants/i18n';
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
    <Notification
      type={NotificationType.SectionMessage}
      className={className}
      variant={isForbidden ? NotificationVariant.Error : NotificationVariant.Warning}
      message={
        <span
          role="region"
          aria-label={t(EntitiesI18nKey.UndeclaredCatalogPropertiesMessage)}
          tabIndex={0}
          className="dial-small-text block min-w-0 max-h-40 overflow-y-auto wrap-anywhere"
        >
          {message}
        </span>
      }
    >
      {isForbidden && !isReadOnlyAdmin && (
        <RemoveButton
          className="shrink-0"
          size={ElementSize.Small}
          label={t(EntitiesI18nKey.RemoveUndeclaredCatalogProperties)}
          onClick={onRemove}
        />
      )}
    </Notification>
  );
};

export default UndeclaredPropertiesBanner;
