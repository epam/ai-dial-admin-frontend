'use client';

import { FC, useLayoutEffect, useRef, useState } from 'react';

import { Tooltip, TooltipPlacement } from '@epam/ai-dial-ui-kit';
import { IconShield } from '@tabler/icons-react';

import { QuerySourcePanelI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';

interface Props {
  field: AnalyticsEntityField;
}

const ColumnRow: FC<Props> = ({ field }) => {
  const t = useI18n();
  const labelRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const label = field.display_name || field.name;
  const hasDetails = !!field.sensitive || !!field.description;

  useLayoutEffect(() => {
    const element = labelRef.current;
    setIsTruncated(!!element && element.scrollWidth > element.clientWidth);
  }, [label]);

  return (
    <li className="flex h-8 items-center gap-3 rounded pl-17 pr-3 hover:bg-accent-primary-alpha focus-within:bg-accent-primary-alpha">
      <Tooltip
        asChild
        placement={TooltipPlacement.Right}
        hideTooltip={!hasDetails && !isTruncated}
        contentClassName="max-w-[320px]"
        tooltip={
          <span className="flex flex-col gap-1">
            {isTruncated && (
              <span className="[overflow-wrap:anywhere]">{t(QuerySourcePanelI18nKey.ColumnName, { name: label })}</span>
            )}
            {field.sensitive && <span>{t(QuerySourcePanelI18nKey.SensitiveData)}</span>}
            {field.description && <span>{field.description}</span>}
          </span>
        }
      >
        <span
          role="note"
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={hasDetails || isTruncated ? 0 : undefined}
          className="flex min-w-0 flex-1 items-center gap-2 rounded"
        >
          <span ref={labelRef} className="truncate text-primary dial-tiny-text">
            {label}
          </span>
          {field.sensitive && <IconShield size={12} className="shrink-0 text-warning" aria-hidden />}
        </span>
      </Tooltip>
      <span className="shrink-0 text-secondary dial-tiny-text">{field.type}</span>
    </li>
  );
};

export default ColumnRow;
