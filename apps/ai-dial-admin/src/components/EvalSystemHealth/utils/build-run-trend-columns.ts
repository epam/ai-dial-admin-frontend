import { ColDef } from 'ag-grid-community';

import { RUN_TRENDS_LENGTH } from '@/src/components/EvalSystemHealth/constants';
import { RunTrendRow } from '@/src/components/EvalSystemHealth/models';
import RunTrendBarsCell from '@/src/components/EvalSystemHealth/RunTrendBarsCell';
import RunTrendDeltaCell from '@/src/components/EvalSystemHealth/RunTrendDeltaCell';
import RunTrendLatestCell from '@/src/components/EvalSystemHealth/RunTrendLatestCell';
import { MISSING_VALUE_DISPLAY } from '@/src/components/Grid/CellRenderers/OptionalValueCellRenderer';
import TitleSubtitleCellRenderer from '@/src/components/Grid/CellRenderers/TitleSubtitleCellRenderer';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const STATIC_COLUMN: ColDef<RunTrendRow> = {
  sortable: false,
  filter: false,
  floatingFilter: false,
  suppressHeaderMenuButton: true,
  suppressMovable: true,
};

const getSuiteHref = (data?: RunTrendRow) => getUrnForEntity(ApplicationRoute.TestSuites, { id: data?.suiteId });

/**
 * The five columns of the run-trends table, in display order. The first two copy the runs table's _Test suite
 * run name_ and _Target_ columns: a name over an identifier, and a name over a type. None sorts or filters: the
 * backend fixes the order, and re-sorting one page would misrepresent the ranking.
 */
export const buildRunTrendColumns = (t: Translate): ColDef<RunTrendRow>[] => [
  {
    ...STATIC_COLUMN,
    colId: 'suite',
    headerName: t(EvalSystemHealthI18nKey.RunTrendsColumnSuite),
    field: 'suiteName',
    cellRenderer: TitleSubtitleCellRenderer,
    cellRendererParams: {
      getSubtitle: (data?: RunTrendRow) => data?.suiteId,
      getHref: getSuiteHref,
    },
    tooltipValueGetter: () => undefined,
    flex: 2,
    minWidth: 160,
  },
  {
    ...STATIC_COLUMN,
    colId: 'evaluatee',
    headerName: t(EvalSystemHealthI18nKey.RunTrendsColumnEvaluatee),
    valueGetter: ({ data }) => data?.evaluateeName ?? MISSING_VALUE_DISPLAY,
    cellRenderer: TitleSubtitleCellRenderer,
    cellRendererParams: {
      getSubtitle: (data?: RunTrendRow) => (data?.kindKey ? t(data.kindKey) : undefined),
    },
    tooltipValueGetter: () => undefined,
    flex: 2,
    minWidth: 140,
  },
  {
    ...STATIC_COLUMN,
    colId: 'trend',
    headerName: t(EvalSystemHealthI18nKey.RunTrendsColumnTrend, { count: RUN_TRENDS_LENGTH }),
    cellRenderer: RunTrendBarsCell,
    flex: 2,
    minWidth: 150,
  },
  {
    ...STATIC_COLUMN,
    colId: 'latest',
    headerName: t(EvalSystemHealthI18nKey.RunTrendsColumnLatest),
    cellRenderer: RunTrendLatestCell,
    flex: 1.5,
    minWidth: 90,
  },
  {
    ...STATIC_COLUMN,
    colId: 'delta',
    headerName: t(EvalSystemHealthI18nKey.RunTrendsColumnDelta),
    cellRenderer: RunTrendDeltaCell,
    flex: 1,
    minWidth: 80,
  },
];
