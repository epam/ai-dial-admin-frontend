/**
 * Preview of a dataset's own values, used to tell test case columns apart when binding a template
 * variable. `valuesByField` holds the first {@link ATTRIBUTE_SAMPLE_LIMIT} rows' value for each
 * column keyed by `TestCaseSchema.name`; `totalCount` is the dataset's full row count, so a consumer
 * can say how many rows the preview leaves out.
 */
export interface AttributeSamples {
  valuesByField: Record<string, string[]>;
  totalCount: number;
}
