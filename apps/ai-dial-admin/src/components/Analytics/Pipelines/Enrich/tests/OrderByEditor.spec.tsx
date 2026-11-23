import { render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import OrderByEditor from '@/src/components/Analytics/Pipelines/Enrich/OrderByEditor';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { MemberSelectOrderBy, SortDirection } from '@/src/models/analytics/pipeline';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@epam/ai-dial-ui-kit')>()),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Select: ({ id, options, value, onChange }: any) => (
    <select id={id} aria-label={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

const FIELDS: AnalyticsEntityField[] = [
  { name: 'request_time', source: 'request_time', type: AnalyticsFieldType.Timestamp },
  { name: 'request_body_full', source: 'request_body_full', type: AnalyticsFieldType.String, projection_only: true },
];

const renderEditor = (orderBy: MemberSelectOrderBy[]) =>
  render(<OrderByEditor orderBy={orderBy} fields={FIELDS} onChange={vi.fn()} />);

const columnSelect = () =>
  within(screen.getByRole('group', { name: `${AnalyticsPipelinesI18nKey.OrderBy} 1` })).getByLabelText(
    'order-by-column-0',
  );

const optionsOf = (select: HTMLElement) =>
  Array.from(select.querySelectorAll('option')).map((option) => option.getAttribute('value'));

describe('OrderByEditor', () => {
  test('does not offer a projection-only column', () => {
    renderEditor([{ column: 'request_time', direction: SortDirection.Desc }]);

    expect(optionsOf(columnSelect())).toEqual(['request_time']);
  });

  test('keeps a projection-only column a saved declaration already names', () => {
    renderEditor([{ column: 'request_body_full', direction: SortDirection.Desc }]);

    expect(columnSelect()).toHaveValue('request_body_full');
  });
});
