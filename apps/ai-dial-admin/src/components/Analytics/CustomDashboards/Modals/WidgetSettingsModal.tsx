'use client';

import { FC, useEffect, useMemo, useState } from 'react';

import { noop } from 'lodash';
import { Input, Label, NumberInput, Popup, PopupSize, Select } from '@epam/ai-dial-ui-kit';
import type { editor } from 'monaco-editor';

import { listSavedQueries } from '@/src/app/[lang]/queries/actions';
import SqlCodeEditor from '@/src/components/Analytics/Common/SqlCodeEditor';
import PersonalQueryCopyBanner from '@/src/components/Analytics/CustomDashboards/Modals/PersonalQueryCopyBanner';
import {
  ValueColumnOption,
  WidgetSettings,
  WidgetSourceKind,
} from '@/src/components/Analytics/CustomDashboards/models';
import { getCurrencySymbol } from '@/src/components/Analytics/CustomDashboards/utils/value-format';
import { getInitialRowLimit, parseRowCount } from '@/src/components/Analytics/CustomDashboards/utils/row-count';
import { formatSql } from '@/src/components/Analytics/QueryBuilder/utils/sql-format';
import { getFormPopupButtons } from '@/src/components/Common/FormPopup/utils';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import { WIDGET_CURRENCIES, WIDGET_VIEW_LABEL_KEY } from '@/src/constants/analytics/dashboards';
import { ButtonsI18nKey, CustomDashboardsI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ChangeDirection, WidgetQuerySource, WidgetValueFormat, WidgetView } from '@/src/models/analytics/dashboard';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';
import { formatQueryPreview } from '@/src/utils/analytics/widget-source';

interface Props {
  header: string;
  submitLabel: string;
  initial: WidgetSettings;
  // Adding picks a saved query or types SQL; editing keeps the source the widget already has.
  isQueryPickable: boolean;
  // A public dashboard copies a picked personal query, which the modal warns about before the add.
  isDashboardPublic?: boolean;
  // The query an edited widget already shows, for its preview.
  previewSource?: WidgetQuerySource;
  // Composite SQL caps its rows with its own LIMIT, so the field has nothing to set.
  isRowCountLocked?: boolean;
  // The views the widget's result fits; absent while there is no result to judge, which hides the picker.
  fittingViews?: WidgetView[];
  // The aggregates a Single value view can show.
  valueColumns?: ValueColumnOption[];
  // Whether the query's own view is a table, which shows a change beside each figure like the Table view.
  isQueryViewTable?: boolean;
  // `picked` is the saved query chosen in Add widget, which a public dashboard copies rather than references.
  onSubmit: (settings: WidgetSettings, rowLimit: number, picked?: SavedQuery) => void;
  onClose: () => void;
}

const WidgetSettingsModal: FC<Props> = ({
  header,
  submitLabel,
  initial,
  isQueryPickable,
  isDashboardPublic = false,
  previewSource,
  isRowCountLocked = false,
  fittingViews,
  valueColumns = [],
  isQueryViewTable = false,
  onSubmit,
  onClose,
}) => {
  const t = useI18n();
  const [formattedInitialSql] = useState(() => formatSql(initial.sql));
  const [settings, setSettings] = useState<WidgetSettings>(() => ({ ...initial, sql: formattedInitialSql }));
  const [isRowCountTouched, setIsRowCountTouched] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  // The views whose change badge takes a colour; a compared line is drawn neutral.
  const isDirectionShown =
    settings.view === WidgetView.Query
      ? isQueryViewTable
      : settings.view === WidgetView.SingleValue || settings.view === WidgetView.Table;

  useEffect(() => {
    if (!isQueryPickable) return;
    const load = async () => {
      const [personal, common] = await Promise.all([
        listSavedQueries(SavedQueryScope.Personal),
        listSavedQueries(SavedQueryScope.Common),
      ]);
      setSavedQueries([...(personal ?? []), ...(common ?? [])]);
    };
    void load();
  }, [isQueryPickable]);

  const queryOptions = useMemo(
    () => savedQueries.map((query) => ({ value: query.id, label: query.name })),
    [savedQueries],
  );

  // Picking a query starts Row count from that query's own limit; a value the user typed is kept.
  const onPickQuery = (value: string | string[]) => {
    const savedQueryId = value as string;
    const picked = savedQueries.find((query) => query.id === savedQueryId);
    setSettings((prev) => ({
      ...prev,
      savedQueryId,
      rowCount: isRowCountTouched ? prev.rowCount : String(getInitialRowLimit(picked)),
    }));
  };

  const sourceOptions = useMemo(
    () => [
      { value: WidgetSourceKind.SavedQuery, label: t(CustomDashboardsI18nKey.SourceSavedQuery) },
      { value: WidgetSourceKind.Sql, label: t(CustomDashboardsI18nKey.SourceSql) },
    ],
    [t],
  );
  const isSql = settings.source === WidgetSourceKind.Sql;
  const sqlLabel = t(CustomDashboardsI18nKey.SqlStatement);
  // A form field rather than a workspace: no gutter, and the editor's name stands in for the drawn label.
  const sqlEditorOptions = useMemo(
    () => ({ ariaLabel: sqlLabel, lineNumbers: 'off' as const, folding: false, lineDecorationsWidth: 8 }),
    [sqlLabel],
  );
  const picked = savedQueries.find((query) => query.id === settings.savedQueryId);
  const isPickedCopied = isDashboardPublic && !isSql && picked?.scope === SavedQueryScope.Personal;
  const previewQuery: Pick<WidgetQuerySource, 'sql' | 'query'> = (isQueryPickable ? picked : previewSource) ?? {};
  const { sql: previewSql, query: previewBody } = previewQuery;
  const preview = useMemo(
    () => (isSql ? '' : formatQueryPreview({ sql: previewSql && formatSql(previewSql), query: previewBody })),
    [isSql, previewSql, previewBody],
  );
  const previewLabel = t(CustomDashboardsI18nKey.QueryPreview);
  const previewEditorOptions = useMemo(
    (): editor.IStandaloneEditorConstructionOptions => ({
      ...sqlEditorOptions,
      ariaLabel: previewLabel,
      readOnly: true,
      domReadOnly: true,
    }),
    [sqlEditorOptions, previewLabel],
  );

  const viewOptions = useMemo(
    () => fittingViews?.map((view) => ({ value: view, label: t(WIDGET_VIEW_LABEL_KEY[view]) })),
    [fittingViews, t],
  );

  const directionOptions = useMemo(
    () => [
      { value: ChangeDirection.HigherIsBetter, label: t(CustomDashboardsI18nKey.HigherIsBetter) },
      { value: ChangeDirection.LowerIsBetter, label: t(CustomDashboardsI18nKey.LowerIsBetter) },
    ],
    [t],
  );

  const formatOptions = useMemo(
    () => [
      { value: WidgetValueFormat.Number, label: t(CustomDashboardsI18nKey.FormatNumber) },
      { value: WidgetValueFormat.Money, label: t(CustomDashboardsI18nKey.FormatMoney) },
      { value: WidgetValueFormat.Percent, label: t(CustomDashboardsI18nKey.FormatPercent) },
      { value: WidgetValueFormat.Duration, label: t(CustomDashboardsI18nKey.FormatDuration) },
    ],
    [t],
  );
  const currencyOptions = useMemo(
    () => WIDGET_CURRENCIES.map((code) => ({ value: code, label: `${code} (${getCurrencySymbol(code)})` })),
    [],
  );
  const isFormatted = settings.view === WidgetView.SingleValue || settings.view === WidgetView.Share;

  const rowLimit = isRowCountLocked ? parseRowCount('') : parseRowCount(settings.rowCount);
  const rowCountError = isRowCountTouched && rowLimit == null ? t(CustomDashboardsI18nKey.RowCountError) : undefined;
  // A SQL statement has no name of its own to head the widget, so it needs a title.
  const hasSource = isSql
    ? !!settings.sql.trim() && !!settings.title.trim()
    : !isQueryPickable || !!settings.savedQueryId;
  const isSubmittable = hasSource && rowLimit != null;

  const onSubmitSettings = () => {
    setIsRowCountTouched(true);
    if (!isSubmittable || rowLimit == null) return;
    onSubmit(
      {
        ...settings,
        title: settings.title.trim(),
        description: settings.description.trim(),
        sql: settings.sql === formattedInitialSql ? initial.sql : settings.sql.trim(),
      },
      rowLimit,
      isSql ? undefined : picked,
    );
    onClose();
  };

  return (
    <Popup
      open
      header={header}
      portalId="WidgetSettingsModal"
      size={PopupSize.Md}
      onClose={onClose}
      mainButtons={getFormPopupButtons({
        cancelLabel: t(ButtonsI18nKey.Cancel),
        submitLabel,
        isSubmitDisabled: !isSubmittable,
        onCancel: onClose,
        onSubmit: onSubmitSettings,
      })}
    >
      <div className="flex flex-col gap-y-6 px-6 py-4">
        {isQueryPickable && (
          <Select
            id="widget-source"
            labelProps={{ label: t(CustomDashboardsI18nKey.Source) }}
            options={sourceOptions}
            value={settings.source}
            onChange={(source) => setSettings((prev) => ({ ...prev, source: source as WidgetSourceKind }))}
          />
        )}
        {isQueryPickable && !isSql && (
          <Select
            id="widget-saved-query"
            searchable
            labelProps={{ label: t(CustomDashboardsI18nKey.SavedQuery), required: true }}
            placeholder={t(CustomDashboardsI18nKey.SelectSavedQuery)}
            options={queryOptions}
            value={settings.savedQueryId || undefined}
            onChange={onPickQuery}
          />
        )}
        {isPickedCopied && <PersonalQueryCopyBanner />}
        {isSql && (
          <div className="flex flex-col gap-y-1">
            <Label label={sqlLabel} required />
            <div className="h-[180px] overflow-hidden rounded border border-primary">
              <SqlCodeEditor
                value={settings.sql}
                options={sqlEditorOptions}
                onChange={(sql) => setSettings((prev) => ({ ...prev, sql }))}
              />
            </div>
          </div>
        )}
        {preview && (
          <div role="group" aria-label={previewLabel} className="flex flex-col gap-y-1">
            <Label label={previewLabel} />
            <div className="h-[180px] overflow-hidden rounded border border-primary">
              <JsonEditorBase
                language={previewQuery.sql == null ? 'json' : 'sql'}
                value={preview}
                options={previewEditorOptions}
                onChange={noop}
              />
            </div>
          </div>
        )}
        <Input
          id="widget-title"
          labelProps={{ label: t(CustomDashboardsI18nKey.WidgetTitle), required: isSql }}
          // A SQL statement has no name for an untitled widget to fall back on.
          placeholder={isSql ? undefined : t(CustomDashboardsI18nKey.WidgetTitlePlaceholder)}
          value={settings.title}
          onChange={(title) => setSettings((prev) => ({ ...prev, title: title ?? '' }))}
        />
        <Input
          id="widget-description"
          labelProps={{ label: t(EntityFieldsI18nKey.description) }}
          value={settings.description}
          onChange={(description) => setSettings((prev) => ({ ...prev, description: description ?? '' }))}
        />
        {viewOptions && (
          <Select
            id="widget-view"
            labelProps={{ label: t(CustomDashboardsI18nKey.View), caption: t(CustomDashboardsI18nKey.ViewHint) }}
            options={viewOptions}
            value={settings.view}
            onChange={(view) => setSettings((prev) => ({ ...prev, view: view as WidgetView }))}
          />
        )}
        {settings.view === WidgetView.SingleValue && valueColumns.length > 0 && (
          <Select
            id="widget-value-column"
            labelProps={{ label: t(CustomDashboardsI18nKey.ValueColumn) }}
            options={valueColumns}
            value={settings.valueColumn || valueColumns[0].value}
            onChange={(column) => setSettings((prev) => ({ ...prev, valueColumn: column as string }))}
          />
        )}
        {isDirectionShown && (
          <Select
            id="widget-change-direction"
            labelProps={{ label: t(CustomDashboardsI18nKey.ChangeDirection) }}
            options={directionOptions}
            value={settings.changeDirection}
            onChange={(direction) =>
              setSettings((prev) => ({ ...prev, changeDirection: direction as ChangeDirection }))
            }
          />
        )}
        {isFormatted && (
          <Select
            id="widget-value-format"
            labelProps={{ label: t(CustomDashboardsI18nKey.ValueFormat) }}
            options={formatOptions}
            value={settings.valueFormat}
            onChange={(format) => setSettings((prev) => ({ ...prev, valueFormat: format as WidgetValueFormat }))}
          />
        )}
        {isFormatted && settings.valueFormat === WidgetValueFormat.Money && (
          <Select
            id="widget-currency"
            labelProps={{ label: t(CustomDashboardsI18nKey.Currency) }}
            options={currencyOptions}
            value={settings.currency}
            onChange={(currency) => setSettings((prev) => ({ ...prev, currency: currency as string }))}
          />
        )}
        <NumberInput
          id="widget-row-count"
          integer
          disabled={isRowCountLocked}
          labelProps={{
            label: t(CustomDashboardsI18nKey.RowCount),
            caption: t(
              isRowCountLocked ? CustomDashboardsI18nKey.RowCountSetByQuery : CustomDashboardsI18nKey.RowCountHint,
            ),
          }}
          value={isRowCountLocked ? '' : settings.rowCount}
          invalid={!!rowCountError}
          error={rowCountError}
          onBlur={() => setIsRowCountTouched(true)}
          onChange={(value) => setSettings((prev) => ({ ...prev, rowCount: value == null ? '' : String(value) }))}
        />
      </div>
    </Popup>
  );
};

export default WidgetSettingsModal;
