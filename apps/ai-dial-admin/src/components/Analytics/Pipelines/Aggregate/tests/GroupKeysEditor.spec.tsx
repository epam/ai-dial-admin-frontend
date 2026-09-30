import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import GroupKeysEditor from '@/src/components/Analytics/Pipelines/Aggregate/GroupKeysEditor';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { GroupKey } from '@/src/models/analytics/pipeline';

// Swapped for native selects so the options can be read, as `SourceField.spec` does for the same control.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  };
});

// The 2.0 select keeps its options in an overlay, so the field is swapped for a native select
// the options can be read out of — as it was when this field was the 1.0 `DialSelectField`.
vi.mock('@/src/components/Common/SelectField/SelectField', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ id, labelProps, options, value, onChange }: any) => (
    <label>
      <span>{labelProps?.label}</span>
      <select
        id={id}
        aria-label={`${labelProps?.label} ${id}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {options.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

const field = (name: string, type: AnalyticsFieldType, source = name): AnalyticsEntityField => ({
  name,
  source,
  type,
});

const FIELDS = [
  field('request_time', AnalyticsFieldType.Timestamp),
  field('deployment', AnalyticsFieldType.String),
  field('usage_client_identity.client_session_id', AnalyticsFieldType.String, 'client_session_id'),
];

const renderEditor = (groupKeys: GroupKey[] = [{ column: 'deployment' }], fields = FIELDS) =>
  render(<GroupKeysEditor groupKeys={groupKeys} fields={fields} onChange={vi.fn()} />);

const columnSelect = () => screen.getByLabelText(`${AnalyticsPipelinesI18nKey.GroupKeyColumn} group-key-column-0`);
const unitSelect = () => screen.getByLabelText(`${AnalyticsPipelinesI18nKey.GroupKeyUnit} group-key-unit-0`);
const optionsOf = (select: HTMLElement) =>
  Array.from(select.querySelectorAll('option')).map((option) => option.getAttribute('value'));

describe('GroupKeysEditor', () => {
  // The service validates a key against the source's entity, so a column an enrichment supplies is one it
  // accepts — and the editor used to offer only the table's own columns, hiding them.
  test('offers a column an enrichment supplies', () => {
    renderEditor();

    expect(optionsOf(columnSelect())).toContain('usage_client_identity.client_session_id');
  });

  test('keeps a column the entity does not offer', () => {
    renderEditor([{ column: 'written_by_hand.value' }]);

    expect(columnSelect()).toHaveValue('written_by_hand.value');
  });

  // With no entity read there is nothing to check a column against, so the row states no verdict on it.
  test('calls no column untruncatable while the entity is unread', () => {
    renderEditor([{ trunc: { column: 'request_time', unit: 'day' } } as GroupKey], []);

    expect(screen.queryByText(AnalyticsPipelinesI18nKey.GroupKeyNotTruncatable)).toBeNull();
    expect(unitSelect()).toHaveValue('day');
  });

  test('reports a truncation the column type cannot take', () => {
    renderEditor([{ trunc: { column: 'deployment', unit: 'day' } } as GroupKey]);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.GroupKeyNotTruncatable)).toBeTruthy();
  });

  test('offers the units a timestamp admits', () => {
    renderEditor([{ trunc: { column: 'request_time', unit: 'hour' } } as GroupKey]);

    expect(optionsOf(unitSelect())).toEqual(['hour', 'day', 'week', 'month']);
  });
});
