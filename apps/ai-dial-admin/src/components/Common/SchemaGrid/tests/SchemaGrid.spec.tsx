import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { JSONSchema7 } from 'json-schema';

import { BasicI18nKey } from '@/src/constants/i18n';
import SchemaGrid from '../SchemaGrid';

const dispatch = vi.fn();

// The global mock in `test-setup.tsx` hands out a fresh `vi.fn()` per call, so the dispatch a
// component made is unobservable through it — this spec needs its own.
vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ isValid: true, dispatch, resetCounter: 0 }),
  ValidationActionType: { SetField: 'SET_FIELD_VALIDATION', RemoveField: 'REMOVE_FIELD_VALIDATION' },
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: () => <section aria-label="grid" />,
}));

const LONG_TITLE = 'x'.repeat(1001);

const schemaWithTitle = (title: string): JSONSchema7 => ({
  type: 'object',
  properties: { summary: { type: 'string', title } },
});

const lastValidity = () =>
  dispatch.mock.calls
    .map(([action]) => action)
    .filter((action) => action.type === 'SET_FIELD_VALIDATION')
    .at(-1)?.isValid;

describe('SchemaGrid :: field constraints', () => {
  beforeEach(() => {
    dispatch.mockClear();
  });

  test('Should block save and name the field for an over-limit title, without showing the title', () => {
    render(<SchemaGrid schema={schemaWithTitle(LONG_TITLE)} onChange={vi.fn()} />);

    expect(lastValidity()).toBe(false);
    expect(screen.getByRole('alert')).toHaveTextContent(BasicI18nKey.FieldValueTooLong);
    expect(screen.queryByText(LONG_TITLE, { exact: false })).not.toBeInTheDocument();
  });

  test('Should unblock save and drop the message once the title fits', () => {
    const { rerender } = render(<SchemaGrid schema={schemaWithTitle(LONG_TITLE)} onChange={vi.fn()} />);

    rerender(<SchemaGrid schema={schemaWithTitle('Summary')} onChange={vi.fn()} />);

    expect(lastValidity()).toBe(true);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('Should not block save when the consumer switches the defaults off', () => {
    render(<SchemaGrid schema={schemaWithTitle(LONG_TITLE)} onChange={vi.fn()} fieldInputProps={false} />);

    expect(lastValidity()).toBe(true);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('Should not block save on a read-only grid', () => {
    render(<SchemaGrid schema={schemaWithTitle(LONG_TITLE)} onChange={vi.fn()} isReadonly />);

    expect(lastValidity()).toBe(true);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
