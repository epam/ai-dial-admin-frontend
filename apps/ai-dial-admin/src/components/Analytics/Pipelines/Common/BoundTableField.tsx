'use client';

import { FC, ReactNode, useCallback } from 'react';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import { tableDetailHref } from '@/src/components/Analytics/Tables/utils';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useCurrentLocale, useI18n } from '@/src/locales/client';
import { getControlClassName } from '@/src/utils/entities/view';

interface Props {
  table?: string;
  caption?: string;
  children: ReactNode;
}

/**
 * A table-bound control with a way to open that table beside it, laid out as `CatalogSchemaField` lays out
 * the same pairing. The pipeline's page states the two tables it is bound to through these controls alone —
 * a second, read-only copy of them among the facts said the same thing twice.
 *
 * The ui-kit button takes its accessible name from its label, so every Open on the page would otherwise be
 * called the same thing. The group is named after the table instead, which is what tells them apart — the
 * field's own label already names the select inside it.
 *
 * The caption sits below the row rather than inside the control's column: with it in the column, the row's
 * bottom edge — which Open aligns to — fell to the bottom of the caption instead of the field.
 */
const BoundTableField: FC<Props> = ({ table, caption, children }) => {
  const t = useI18n();
  const currentLocale = useCurrentLocale();

  const openInNewTab = useCallback(() => {
    if (table) window.open(`/${currentLocale}${tableDetailHref(table)}`, '_blank');
  }, [currentLocale, table]);

  return (
    <div role={table ? 'group' : undefined} aria-label={table} className="flex flex-col gap-y-1">
      <div className="flex items-end gap-2">
        <div className={getControlClassName()}>{children}</div>
        {table && (
          <DialNeutralButton
            label={t(ButtonsI18nKey.Open)}
            iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
            onClick={openInNewTab}
          />
        )}
      </div>
      {caption && <span className="text-secondary dial-tiny-text">{caption}</span>}
    </div>
  );
};

export default BoundTableField;
