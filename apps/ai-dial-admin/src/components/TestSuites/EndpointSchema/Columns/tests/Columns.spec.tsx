import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';
import Columns from '../Columns';

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: () => <div>Grid</div>,
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();

  return {
    ...actual,
    DialNotification: ({ message }: { message: string }) => <div role="alert">{message}</div>,
  };
});

describe('Columns', () => {
  test('shows a previous-request duplicate error banner', () => {
    render(
      <Columns
        responseColumns={[{ name: 'answer', displayName: 'answer', expression: 'a', type: 'string' }]}
        onChangeResponseColumns={vi.fn()}
        responseSchema={{}}
        duplicateColumn={{ name: 'answer', inPreviousRequest: true }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(TestSuitesI18nKey.DuplicateResponseColumnNameInPreviousRequest);
  });

  test('shows a sibling duplicate error banner', () => {
    render(
      <Columns
        responseColumns={[
          { name: 'answer', displayName: 'answer', expression: 'a', type: 'string' },
          { name: 'answer', displayName: 'answer', expression: 'b', type: 'string' },
        ]}
        onChangeResponseColumns={vi.fn()}
        responseSchema={{}}
        duplicateColumn={{ name: 'answer', inPreviousRequest: false }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(TestSuitesI18nKey.DuplicateResponseColumnName);
  });

  test('hides the error banner when there is no duplicate', () => {
    render(
      <Columns
        responseColumns={[{ name: 'answer', displayName: 'answer', expression: 'a', type: 'string' }]}
        onChangeResponseColumns={vi.fn()}
        responseSchema={{}}
      />,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
