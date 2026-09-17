import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import AttributeSelect from '@/src/components/TestSuites/Common/DynamicConfiguration/AttributeSelect';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';

const SCHEMA: TestCaseSchema[] = [
  {
    name: 'question',
    type: TestCaseItemType.STRING,
    required: true,
    description: 'e.g. “Some species of wildlife can only survive in what specific environment?”',
  },
  { name: 'document', type: TestCaseItemType.ARRAY, required: false, description: 'e.g. “[ "https://a" ]”' },
  { name: 'year', type: TestCaseItemType.INTEGER, required: false, description: '' },
];

describe('AttributeSelect', () => {
  const renderSelect = (props?: Partial<Parameters<typeof AttributeSelect>[0]>) =>
    render(<AttributeSelect schema={SCHEMA} onChange={vi.fn()} {...props} />);

  const openList = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: TestSuitesI18nKey.Attribute }));
  };

  test('shows the placeholder until an attribute is bound, then the bound column name', () => {
    const { unmount } = renderSelect();
    expect(screen.getByRole('button', { name: TestSuitesI18nKey.Attribute })).toHaveTextContent(
      TestSuitesI18nKey.SelectAttribute,
    );

    unmount();
    renderSelect({ value: 'document' });
    expect(screen.getByRole('button', { name: TestSuitesI18nKey.Attribute })).toHaveTextContent('document');
  });

  test('lists every schema column under the test case columns heading with its type and description', async () => {
    const user = userEvent.setup();
    renderSelect();

    await openList(user);

    expect(screen.getByText(TestSuitesI18nKey.TestCaseColumns)).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(SCHEMA.length);

    const question = screen.getByRole('option', { name: /question/ });
    expect(question).toHaveTextContent('string');
    expect(question).toHaveTextContent(
      'e.g. “Some species of wildlife can only survive in what specific environment?”',
    );
  });

  test('marks the bound column as selected and leaves the others unselected', async () => {
    const user = userEvent.setup();
    renderSelect({ value: 'year' });

    await openList(user);

    expect(screen.getByRole('option', { name: /year/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: /document/ })).toHaveAttribute('aria-selected', 'false');
  });

  test('picking a column reports its name and closes the list', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSelect({ onChange });

    await openList(user);
    await user.click(screen.getByRole('option', { name: /document/ }));

    expect(onChange).toHaveBeenCalledWith('document');
    expect(screen.queryByRole('option')).toBeNull();
  });

  test('renders an empty-schema message instead of options', async () => {
    const user = userEvent.setup();
    renderSelect({ schema: [] });

    await openList(user);

    expect(screen.getByText(TestSuitesI18nKey.NoSchemaFields)).toBeInTheDocument();
    expect(screen.queryByRole('option')).toBeNull();
  });

  test('does not open while readonly', async () => {
    const user = userEvent.setup();
    renderSelect({ disabled: true });

    await openList(user);

    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
