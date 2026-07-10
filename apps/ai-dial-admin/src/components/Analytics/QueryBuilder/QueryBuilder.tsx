'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import { DialLoader, DialNoDataContent, DialPrimaryButton, DialSegmentedControl } from '@epam/ai-dial-ui-kit';
import type { SegmentedControlOption } from '@epam/ai-dial-ui-kit';
import { IconPlayerPlay } from '@tabler/icons-react';

import { getDetailedEntitySchema, getEntitySchema } from '@/src/app/[lang]/query-builder/actions';
import JsonEditorBase from '@/src/components/Common/JsonEditorBase/JsonEditorBase';
import SqlEditor from '@/src/components/Analytics/QueryBuilder/Sql/SqlEditor';
import { QueryBuilderContext } from '@/src/components/Analytics/QueryBuilder/context';
import LabeledField from '@/src/components/Analytics/QueryBuilder/LabeledField';
import SourceSection from '@/src/components/Analytics/QueryBuilder/Source/SourceSection';
import SchemaPreviewPopup from '@/src/components/Analytics/QueryBuilder/Source/SchemaPreviewPopup';
import ModeSelector from '@/src/components/Analytics/QueryBuilder/Mode/ModeSelector';
import FilterGroup from '@/src/components/Analytics/QueryBuilder/Filter/FilterGroup';
import SelectProjection from '@/src/components/Analytics/QueryBuilder/Select/SelectProjection';
import GroupBySection from '@/src/components/Analytics/QueryBuilder/Aggregate/GroupBySection';
import TimeBuckets from '@/src/components/Analytics/QueryBuilder/Aggregate/TimeBuckets';
import Aggregates from '@/src/components/Analytics/QueryBuilder/Aggregate/Aggregates';
import SortKeys from '@/src/components/Analytics/QueryBuilder/Sort/SortKeys';
import PageSection from '@/src/components/Analytics/QueryBuilder/Page/PageSection';
import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import QueryResultSidebar from '@/src/components/Analytics/QueryBuilder/Result/QueryResultSidebar';
import { havingFieldOptions, sortByName } from '@/src/components/Analytics/QueryBuilder/utils/fields';
import { buildQuery, getAggregateWarnings } from '@/src/components/Analytics/QueryBuilder/utils/serialize';
import { parseQuery } from '@/src/components/Analytics/QueryBuilder/utils/deserialize';
import { createInitialState } from '@/src/components/Analytics/QueryBuilder/utils/state';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ButtonsI18nKey, MenuI18nKey, QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { AnalyticsEntity, AnalyticsEntityField } from '@/src/models/analytics/entity';
import { QueryMode, StructuredQuery } from '@/src/models/analytics/query';
import {
  QueryBuilderState,
  QueryBuilderView,
  QueryBuilderWarning,
  QueryRequestKind,
  QueryRunRequest,
} from '@/src/models/analytics/query-builder';
import { getErrorNotification } from '@/src/utils/notification';

const WARNING_KEYS: Record<QueryBuilderWarning, QueryBuilderI18nKey> = {
  [QueryBuilderWarning.MissingAggregateAlias]: QueryBuilderI18nKey.WarningMissingAggregateAlias,
  [QueryBuilderWarning.MissingBucketField]: QueryBuilderI18nKey.WarningMissingBucketField,
  [QueryBuilderWarning.MissingBucketAlias]: QueryBuilderI18nKey.WarningMissingBucketAlias,
  [QueryBuilderWarning.EmptyAggregate]: QueryBuilderI18nKey.WarningEmptyAggregate,
};

interface Props {
  initialEntities: AnalyticsEntity[];
  initialEntityName: string;
  initialFields: AnalyticsEntityField[];
}

const QueryBuilder: FC<Props> = ({ initialEntities, initialEntityName, initialFields }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const { sidebar } = useAppContext();

  const [state, setState] = useState<QueryBuilderState>(() => ({
    ...createInitialState(),
    entityName: initialEntityName,
    fields: initialFields,
  }));
  const [entities] = useState<AnalyticsEntity[]>(initialEntities);
  const [selectedEntityName, setSelectedEntityName] = useState(initialEntityName);
  const [instanceId, setInstanceId] = useState('');
  const [schemaPreviewOpen, setSchemaPreviewOpen] = useState(false);
  const [view, setView] = useState<QueryBuilderView>(QueryBuilderView.Form);
  const [jsonText, setJsonText] = useState('');
  const [jsonInvalid, setJsonInvalid] = useState(false);
  // SQL is an independent buffer: it seeds from nothing, persists across view switches, and never
  // back-propagates into the builder state (the DSL cannot round-trip arbitrary SQL).
  const [sqlText, setSqlText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => setState((prev) => ({ ...prev })), []);
  const patch = useCallback((partial: Partial<QueryBuilderState>) => setState((prev) => ({ ...prev, ...partial })), []);

  const applySchema = useCallback((entityName: string, fields: AnalyticsEntityField[]) => {
    setState({ ...createInitialState(), entityName, fields });
  }, []);

  const handleSchemaFailed = useCallback(() => {
    setError(t(QueryBuilderI18nKey.SchemaLoadFailed));
    showNotification(getErrorNotification(t(QueryBuilderI18nKey.SchemaLoadFailed)));
  }, [showNotification, t]);

  const loadBaseSchema = useCallback(
    async (name: string) => {
      setIsLoading(true);
      setError(null);
      const schema = await getEntitySchema(name);
      if (schema) applySchema(name, schema.fields || []);
      else handleSchemaFailed();
      setIsLoading(false);
    },
    [applySchema, handleSchemaFailed],
  );

  const selectedEntity = entities.find((e) => e.name === selectedEntityName);
  const isComplex = !!selectedEntity?.complex;

  const onSelectEntity = (name: string) => {
    setSelectedEntityName(name);
    setInstanceId('');
    const entity = entities.find((e) => e.name === name);
    if (entity?.complex) {
      setState({ ...createInitialState(), entityName: name });
      setError(null);
    } else {
      void loadBaseSchema(name);
    }
  };

  const onLoadDetailed = async () => {
    if (!selectedEntity) return;
    const idField = selectedEntity.schemaIdField || 'id';
    if (!instanceId.trim()) {
      showNotification(getErrorNotification(t(QueryBuilderI18nKey.InstanceIdRequired)));
      return;
    }
    setIsLoading(true);
    setError(null);
    const schema = await getDetailedEntitySchema(selectedEntity.name, idField, instanceId.trim());
    if (schema) applySchema(selectedEntity.name, schema.fields || []);
    else handleSchemaFailed();
    setIsLoading(false);
  };

  const fieldsLoaded = state.fields.length > 0;
  const query = useMemo(() => buildQuery(state), [state]);
  const json = useMemo(() => JSON.stringify(query, null, 2), [query]);
  const warnings = useMemo(() => getAggregateWarnings(state).map((w) => t(WARNING_KEYS[w])), [state, t]);
  const contextValue = useMemo(() => ({ state, refresh, patch }), [state, refresh, patch]);
  const isAggregate = state.mode === QueryMode.Aggregate;
  const isJsonView = view === QueryBuilderView.Json;
  const isSqlView = view === QueryBuilderView.Sql;

  const viewOptions: SegmentedControlOption<QueryBuilderView>[] = [
    { value: QueryBuilderView.Form, label: t(QueryBuilderI18nKey.ViewForm) },
    { value: QueryBuilderView.Json, label: t(QueryBuilderI18nKey.ViewJson) },
    { value: QueryBuilderView.Sql, label: t(QueryBuilderI18nKey.ViewSql) },
  ];

  // Switching views preserves each view's own buffer. Entering JSON re-seeds it from the current
  // builder state (JSON mirrors the form); the SQL buffer is left untouched either way.
  const onChangeView = (next: QueryBuilderView) => {
    if (next === QueryBuilderView.Json) {
      setJsonText(json);
      setJsonInvalid(false);
    }
    setView(next);
  };

  const onChangeJson = (text: string | undefined) => {
    const value = text ?? '';
    setJsonText(value);
    try {
      const parsed = JSON.parse(value) as StructuredQuery;
      setState(parseQuery(parsed, state.fields));
      setJsonInvalid(false);
    } catch {
      setJsonInvalid(true);
    }
  };

  const onRun = () => {
    let request: QueryRunRequest;
    if (isSqlView) {
      if (!sqlText.trim()) return;
      request = { kind: QueryRequestKind.Sql, sql: sqlText };
    } else {
      let runQuery: StructuredQuery = query;
      if (isJsonView) {
        try {
          runQuery = JSON.parse(jsonText) as StructuredQuery;
        } catch {
          return;
        }
      }
      request = { kind: QueryRequestKind.Structured, query: runQuery };
    }
    sidebar.showSidebar(<QueryResultSidebar request={request} />, 'w-1/2 max-w-[800px]');
  };

  return (
    <QueryBuilderContext.Provider value={contextValue}>
      <div className="flex flex-col flex-1 min-h-0 w-full bg-layer-2 rounded p-4 relative">
        <div className="flex flex-row mb-8 justify-between items-center gap-4 h-[40px]">
          <h1>{t(MenuI18nKey.QueryBuilder)}</h1>
          <div className="flex items-center gap-4">
            {fieldsLoaded && (
              <CopyButton
                value={isSqlView ? sqlText : isJsonView ? jsonText : json}
                valueLabel={isSqlView ? t(QueryBuilderI18nKey.SqlQuery) : t(QueryBuilderI18nKey.StructuredQueryJson)}
                buttonLabel={t(ButtonsI18nKey.Copy)}
              />
            )}
            <DialPrimaryButton
              label={t(QueryBuilderI18nKey.Run)}
              iconBefore={<IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} />}
              disabled={!fieldsLoaded || (isJsonView && jsonInvalid) || (isSqlView && !sqlText.trim())}
              onClick={onRun}
            />
          </div>
        </div>

        {!entities.length ? (
          <DialNoDataContent title={t(QueryBuilderI18nKey.EntitiesLoadFailed)} />
        ) : (
          <div className="flex flex-1 min-h-0 flex-col gap-6">
            <LabeledField title={t(QueryBuilderI18nKey.Source)}>
              <SourceSection
                entities={entities}
                selectedEntityName={selectedEntityName}
                onSelectEntity={onSelectEntity}
                isComplex={isComplex}
                instanceId={instanceId}
                onChangeInstanceId={setInstanceId}
                onLoadDetailed={onLoadDetailed}
                fieldsLoaded={fieldsLoaded}
                onOpenSchemaPreview={() => setSchemaPreviewOpen(true)}
              />
            </LabeledField>

            {fieldsLoaded && (
              <DialSegmentedControl
                className="w-fit"
                ariaLabel={t(QueryBuilderI18nKey.ViewSwitcher)}
                options={viewOptions}
                value={view}
                onChange={onChangeView}
              />
            )}

            {!fieldsLoaded ? (
              isLoading ? (
                <DialLoader size={40} />
              ) : error ? (
                <DialNoDataContent title={error} />
              ) : isComplex ? (
                <DialNoDataContent title={t(QueryBuilderI18nKey.InstanceIdRequired)} />
              ) : null
            ) : isJsonView ? (
              <div className="flex flex-1 min-h-0 flex-col gap-2">
                {jsonInvalid && <span className="text-error dial-tiny-text">{t(QueryBuilderI18nKey.InvalidJson)}</span>}
                <div className="min-h-0 flex-1 overflow-hidden rounded border border-primary">
                  <JsonEditorBase value={jsonText} onChange={onChangeJson} />
                </div>
              </div>
            ) : isSqlView ? (
              <div className="min-h-0 flex-1 overflow-hidden rounded border border-primary">
                <SqlEditor value={sqlText} onChange={setSqlText} fields={state.fields} entityName={state.entityName} />
              </div>
            ) : (
              <div className="flex flex-1 min-h-0 flex-col gap-6 overflow-y-auto">
                {warnings.length > 0 && (
                  <div className="flex flex-col gap-1 rounded border border-warning bg-warning px-3 py-2 dial-tiny-text text-primary">
                    {warnings.map((w) => (
                      <span key={w}>{w}</span>
                    ))}
                  </div>
                )}
                <LabeledField title={t(QueryBuilderI18nKey.Mode)}>
                  <ModeSelector />
                </LabeledField>

                <LabeledField title={t(QueryBuilderI18nKey.Filter)} pill={t(QueryBuilderI18nKey.Where)}>
                  <FilterGroup
                    node={state.filter}
                    parent={null}
                    fieldOptions={sortByName(state.fields).map((f) => ({ name: f.name, type: f.type }))}
                  />
                </LabeledField>

                {!isAggregate && (
                  <LabeledField title={t(QueryBuilderI18nKey.Select)} pill={t(QueryBuilderI18nKey.Projection)}>
                    <SelectProjection />
                  </LabeledField>
                )}

                {isAggregate && (
                  <>
                    <LabeledField title={t(QueryBuilderI18nKey.GroupBy)}>
                      <GroupBySection />
                    </LabeledField>
                    <LabeledField title={t(QueryBuilderI18nKey.TimeBucket)}>
                      <TimeBuckets />
                    </LabeledField>
                    <LabeledField title={t(QueryBuilderI18nKey.Aggregate)}>
                      <Aggregates />
                    </LabeledField>
                    <LabeledField title={t(QueryBuilderI18nKey.Having)}>
                      <FilterGroup node={state.having} parent={null} fieldOptions={havingFieldOptions(state)} />
                    </LabeledField>
                  </>
                )}

                <LabeledField title={t(QueryBuilderI18nKey.Sort)}>
                  <SortKeys />
                </LabeledField>

                <LabeledField title={t(QueryBuilderI18nKey.Page)}>
                  <PageSection />
                </LabeledField>
              </div>
            )}
          </div>
        )}
      </div>

      <SchemaPreviewPopup
        open={schemaPreviewOpen}
        onClose={() => setSchemaPreviewOpen(false)}
        entityName={state.entityName}
        fields={state.fields}
      />
    </QueryBuilderContext.Provider>
  );
};

export default QueryBuilder;
