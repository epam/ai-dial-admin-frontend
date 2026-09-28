import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import AttributeSelect from '@/src/components/TestSuites/Common/DynamicConfiguration/AttributeSelect';
import { BasicI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { AttributeSamples } from '@/src/models/evaluation/attribute-samples';
import { TestCaseSchema } from '@/src/models/evaluation/test-suite';
import { TestCaseItemType } from '@/src/types/evaluation';

const SCHEMA: TestCaseSchema[] = [
  { name: 'question', type: TestCaseItemType.STRING, required: true, description: '' },
  { name: 'document', type: TestCaseItemType.ARRAY, required: false, description: '' },
  { name: 'year', type: TestCaseItemType.INTEGER, required: false, description: '' },
];

const SAMPLES: AttributeSamples = {
  valuesByField: {
    question: ['Where do penguins live?', 'How tall is Everest?'],
    document: ['["https://a"]'],
    year: [],
  },
  totalCount: 42,
};

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

  test('lists each schema column as a single row carrying its name and type', async () => {
    const user = userEvent.setup();
    renderSelect();

    await openList(user);

    expect(screen.getAllByRole('option')).toHaveLength(SCHEMA.length);
    expect(screen.getByRole('option', { name: /question/ })).toHaveTextContent('string');
    expect(screen.getByRole('option', { name: /year/ })).toHaveTextContent('integer');
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

  describe('AttributeSelect — search', () => {
    test('narrows the list to columns matching the typed name, case-insensitively', async () => {
      const user = userEvent.setup();
      renderSelect();

      await openList(user);
      await user.type(screen.getByPlaceholderText(BasicI18nKey.Search), 'DOC');

      expect(screen.getAllByRole('option')).toHaveLength(1);
      expect(screen.getByRole('option', { name: /document/ })).toBeInTheDocument();
    });

    test('reports no match rather than an empty list when nothing matches', async () => {
      const user = userEvent.setup();
      renderSelect();

      await openList(user);
      await user.type(screen.getByPlaceholderText(BasicI18nKey.Search), 'nothing');

      expect(screen.getByText(TestSuitesI18nKey.NoMatchingColumns)).toBeInTheDocument();
      expect(screen.queryByRole('option')).toBeNull();
    });

    test('starts a fresh visit with the previous search cleared', async () => {
      const user = userEvent.setup();
      renderSelect();

      await openList(user);
      await user.type(screen.getByPlaceholderText(BasicI18nKey.Search), 'year');
      await user.click(screen.getByRole('button', { name: TestSuitesI18nKey.Attribute }));
      await openList(user);

      expect(screen.getAllByRole('option')).toHaveLength(SCHEMA.length);
    });
  });

  describe('AttributeSelect — value preview', () => {
    test('previews the dataset rows for the hovered column and counts the rows left out', async () => {
      const user = userEvent.setup();
      renderSelect({ samples: SAMPLES });

      await openList(user);
      await user.hover(screen.getByRole('option', { name: /question/ }));

      expect(await screen.findByText('Where do penguins live?')).toBeInTheDocument();
      expect(screen.getByText('How tall is Everest?')).toBeInTheDocument();
      expect(screen.getByText(TestSuitesI18nKey.MoreDatasetRows)).toBeInTheDocument();
    });

    test('shows no preview for a column with no sampled values', async () => {
      const user = userEvent.setup();
      renderSelect({ samples: SAMPLES });

      await openList(user);
      await user.hover(screen.getByRole('option', { name: /year/ }));

      expect(screen.queryByText(TestSuitesI18nKey.MoreDatasetRows)).toBeNull();
    });
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
