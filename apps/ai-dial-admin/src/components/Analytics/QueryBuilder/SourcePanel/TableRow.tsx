'use client';

import { FC, useId } from 'react';

import { ElementSize, GhostIconButton, Tooltip, TooltipPlacement } from '@epam/ai-dial-ui-kit';
import { IconCaretDownFilled, IconCaretRightFilled } from '@tabler/icons-react';
import classNames from 'classnames';
import Link from 'next/link';

import TableColumns from '@/src/components/Analytics/QueryBuilder/SourcePanel/TableColumns';
import { useSourcePanel } from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { SourceTable } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { getDraftHref } from '@/src/components/Analytics/QueryBuilder/SourcePanel/utils/source-panel';
import { QuerySourcePanelI18nKey } from '@/src/constants/i18n';
import { useCurrentLocale, useI18n } from '@/src/locales/client';

interface Props {
  table: SourceTable;
  isCurrent: boolean;
}

const TableRow: FC<Props> = ({ table, isCurrent }) => {
  const t = useI18n();
  const locale = useCurrentLocale();
  const columnsId = useId();
  const { expandedTables, onToggleTable, onNavigate } = useSourcePanel();

  const isExpanded = expandedTables.includes(table.name);
  const href = getDraftHref(locale);
  const ToggleIcon = isExpanded ? IconCaretDownFilled : IconCaretRightFilled;

  return (
    <li>
      <div
        className={classNames(
          'flex min-h-8 items-center rounded px-3 hover:bg-accent-primary-alpha focus-within:bg-accent-primary-alpha',
          isCurrent && 'bg-accent-primary-alpha',
        )}
      >
        <GhostIconButton
          size={ElementSize.Small}
          aria-label={t(QuerySourcePanelI18nKey.TableColumns, { name: table.name })}
          aria-expanded={isExpanded}
          aria-controls={columnsId}
          icon={<ToggleIcon size={12} aria-hidden />}
          onClick={() => onToggleTable(table.name)}
        />
        <Tooltip
          asChild
          placement={TooltipPlacement.Right}
          tooltip={table.description}
          hideTooltip={!table.description}
          contentClassName="max-w-[320px]"
        >
          <Link
            href={href}
            aria-current={isCurrent ? 'page' : undefined}
            className="min-w-0 flex-1 py-1 text-primary dial-tiny-text [overflow-wrap:anywhere]"
            onClick={(event) => onNavigate(event, href, table.name)}
          >
            {table.name}
          </Link>
        </Tooltip>
      </div>
      {isExpanded && <TableColumns id={columnsId} table={table} />}
    </li>
  );
};

export default TableRow;
