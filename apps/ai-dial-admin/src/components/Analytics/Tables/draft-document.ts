import {
  AnalyticsTable,
  AnalyticsTableGrain,
  DraftSchemaDto,
  DraftTableDocument,
  UpdateTableDto,
} from '@/src/models/analytics/table';

// The seed: the column form's schema DTO plus the table's stored catalog metadata. Both keys are
// always present, even on a table with neither, so they are visible and editable in the document from
// the first open (see design.md D3).
export const buildDraftDocument = (table: AnalyticsTable, schema: DraftSchemaDto): DraftTableDocument => ({
  ...schema,
  description: table.description ?? '',
  tag_order: table.tag_order ?? [],
});

// Unpacks a nested `grain: { grain_key, cardinality }` read shape into its flat members, omitting
// `cardinality` when the nested object does not carry it.
const unpackGrain = (grain?: AnalyticsTableGrain): Partial<AnalyticsTableGrain> => {
  if (!grain) return {};
  const { grain_key, cardinality } = grain;
  return cardinality === undefined ? { grain_key } : { grain_key, cardinality };
};

// Splits a parsed document into the two request bodies "Saving a table draft as metadata then schema"
// specifies. One destructure does the whole job: the seven read-only/identity members a
// `GET /v1/tables/{name}` response carries are dropped, `grain` is pulled out for unpacking,
// `description`/`tag_order` are routed to the metadata request, and everything else — including a
// member this console does not otherwise read or write — passes through to the schema request
// untouched. The unpacked `grain_key`/`cardinality` are spread before `...rest` so a flat member
// already present in the document wins over the nested one.
export const splitDraftDocument = (
  document: DraftTableDocument,
): { update: UpdateTableDto; schema: DraftSchemaDto } => {
  const {
    status: __status,
    system: __system,
    permissions: __permissions,
    column_count: __column_count,
    name: __name,
    type: __type,
    source_table: __source_table,
    grain,
    description,
    tag_order,
    ...rest
  } = document as DraftTableDocument & { grain?: AnalyticsTableGrain };

  return {
    update: { description, tag_order },
    schema: { ...unpackGrain(grain), ...rest } as DraftSchemaDto,
  };
};
