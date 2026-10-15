import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JSONSchema7 } from 'json-schema';
import { describe, expect, test, vi } from 'vitest';

import { JsonAtaI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import SchemaTree from '../SchemaTree';

const responseSchema: JSONSchema7 = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    usage: { type: 'object', properties: { total_tokens: { type: 'integer' } } },
    choices: {
      type: 'array',
      items: {
        type: 'object',
        properties: { message: { type: 'object', properties: { content: { type: 'string' } } } },
      },
    },
  },
};

const rowButton = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

describe('SchemaTree', () => {
  const renderTree = (schema: JSONSchema7 = responseSchema) => {
    const onSelect = vi.fn();
    render(<SchemaTree responseSchema={schema} onSelect={onSelect} />);
    return { onSelect, user: userEvent.setup() };
  };

  test('renders a row with its type tag for every top-level property', () => {
    renderTree();

    expect(rowButton('id')).toBeTruthy();
    expect(rowButton('usage')).toBeTruthy();
    expect(rowButton('choices')).toBeTruthy();
    expect(screen.getByText('string')).toBeTruthy();
    expect(screen.getByText('object')).toBeTruthy();
    expect(screen.getByText('array')).toBeTruthy();
  });

  test('offers a chevron only on rows that have children', () => {
    renderTree();

    expect(screen.getAllByRole('button', { name: JsonAtaI18nKey.ExpandField })).toHaveLength(2);
  });

  test('expands a row with its chevron without selecting it', async () => {
    const { onSelect, user } = renderTree();

    await user.click(screen.getAllByRole('button', { name: JsonAtaI18nKey.ExpandField })[0]);

    expect(rowButton('total_tokens')).toBeTruthy();
    expect(screen.getByRole('button', { name: JsonAtaI18nKey.CollapseField }).getAttribute('aria-expanded')).toBe(
      'true',
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('selects a node with its path and upper-cased type', async () => {
    const { onSelect, user } = renderTree();

    await user.click(rowButton('id'));

    expect(onSelect).toHaveBeenCalledWith({ expression: 'id', type: 'STRING' });
  });

  test('also expands a node with children when it is picked', async () => {
    const { onSelect, user } = renderTree();

    await user.click(rowButton('usage'));

    expect(onSelect).toHaveBeenCalledWith({ expression: 'usage', type: 'OBJECT' });
    expect(rowButton('total_tokens')).toBeTruthy();
  });

  test('builds JSONata paths through array items', async () => {
    const { onSelect, user } = renderTree();

    await user.click(rowButton('choices'));
    await user.click(rowButton('message'));

    expect(onSelect).toHaveBeenLastCalledWith({ expression: 'choices[0].message', type: 'OBJECT' });
  });

  test('marks only the most recently picked row as current', async () => {
    const { user } = renderTree();

    await user.click(rowButton('id'));
    expect(rowButton('id').getAttribute('aria-current')).toBe('true');

    await user.click(rowButton('usage'));

    expect(rowButton('usage').getAttribute('aria-current')).toBe('true');
    expect(rowButton('id').getAttribute('aria-current')).toBeNull();
  });

  test('shows the empty state for a schema without properties', () => {
    renderTree({ type: 'object' });

    expect(screen.getByText(TestSuitesI18nKey.NoSchemaProperties)).toBeTruthy();
  });
});
