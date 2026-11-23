import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import type { ColDef, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';

import TableView from '@/src/components/Applications/ParametersTab/TableView';
import { ApplicationPropertyRow } from '@/src/components/Applications/ParametersTab/models';
import { TypeEntity } from '@/src/models/dial/application';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { ParamsFields } from '@/src/types/parameters';

vi.mock('@/src/components/Grid/GridView/GridView', async () => {
  const { createElement, useEffect, useMemo, useRef, useState } = await import('react');
  return {
    default: ({ onGridReady }: { onGridReady: (event: GridReadyEvent) => void }) => {
      const [rows, setRows] = useState<ApplicationPropertyRow[]>([]);
      const [columns, setColumns] = useState<ColDef[]>([]);
      const onReadyRef = useRef(onGridReady);
      const api = useMemo(
        () => ({
          updateGridOptions: (options: { rowData: ApplicationPropertyRow[]; columnDefs: ColDef[] }) => {
            setRows(options.rowData);
            setColumns(options.columnDefs);
          },
          isDestroyed: () => false,
        }),
        [],
      );
      useEffect(() => {
        onReadyRef.current({ api } as unknown as GridReadyEvent);
      }, [api]);
      const valueColumn = columns.find((column) => column.field === ParamsFields.VALUE);
      const typeColumn = columns.find((column) => column.field === ParamsFields.TYPE);
      return rows.map((row, index) => {
        const params = {
          value: row.value,
          data: row,
          colDef: valueColumn,
          node: { rowIndex: index },
          setValue: (value: unknown) =>
            setRows((previous) => previous.map((item) => (item.key === row.key ? { ...item, value } : item))),
        } as ICellRendererParams;
        const selection = valueColumn?.cellRendererSelector?.(params);
        const typeParams = typeColumn?.cellRendererParams;
        return (
          <div key={row.key}>
            {selection && createElement(selection.component, { ...params, ...selection.params })}
            <select
              aria-label={`Type ${row.key}`}
              value={row.type}
              onChange={(event) => typeParams?.onChange(event.target.value, row, ParamsFields.TYPE, index)}
            >
              {typeParams?.getItems(row).map((item: { value: string; label: string }) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        );
      });
    },
  };
});

const schemeProperties: ApplicationPropertyRow[] = [
  {
    key: 'schemaPrompt',
    value: 'schema value',
    type: TypeEntity.STRING,
    allowedTypes: [TypeEntity.STRING],
    required: true,
    isFromScheme: true,
  },
];
const initialProperties = { schemaPrompt: 'schema value', userPrompt: 'user value', count: 2 };

describe('TableView — interactions', () => {
  test('keeps schema and user inline edits isolated and focused', async () => {
    const user = userEvent.setup();
    const onChangeProperties = vi.fn();
    const Harness = () => {
      const [properties, setProperties] = useState<Record<string, unknown>>(initialProperties);
      return (
        <TableView
          applicationProperties={properties}
          schemeProperties={schemeProperties}
          onChangeProperties={(next) => {
            onChangeProperties(next);
            setProperties(next);
          }}
          onValidityChange={vi.fn()}
          isAddClicked={false}
          setIsAddClicked={vi.fn()}
        />
      );
    };
    render(<Harness />);
    const userInput = screen.getByRole('textbox', { name: 'userPrompt' });
    await user.click(userInput);
    await user.type(userInput, '!');
    expect(userInput).toHaveFocus();
    const schemaInput = screen.getByRole('textbox', { name: 'schemaPrompt' });
    await user.click(schemaInput);
    await user.type(schemaInput, '!');
    expect(schemaInput).toHaveFocus();
    expect(onChangeProperties).toHaveBeenLastCalledWith({
      schemaPrompt: 'schema value!',
      userPrompt: 'user value!',
      count: 2,
    });
  });

  test('isolates popup edits between schema and user rows and retains the applied draft', async () => {
    const user = userEvent.setup();
    const onChangeProperties = vi.fn();
    const Harness = () => {
      const [properties, setProperties] = useState<Record<string, unknown>>(initialProperties);
      return (
        <TableView
          applicationProperties={properties}
          schemeProperties={schemeProperties}
          onChangeProperties={(next) => {
            onChangeProperties(next);
            setProperties(next);
          }}
          onValidityChange={vi.fn()}
          isAddClicked={false}
          setIsAddClicked={vi.fn()}
        />
      );
    };
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: `${ButtonsI18nKey.Open} userPrompt` }));
    fireEvent.change(screen.getByRole('textbox', { name: 'userPrompt' }), {
      target: { value: '  first\n\nsecond  \n' },
    });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Apply }));
    expect(onChangeProperties).toHaveBeenLastCalledWith({
      ...initialProperties,
      userPrompt: '  first\n\nsecond  \n',
    });
    expect(screen.getByRole('textbox', { name: 'userPrompt' })).toHaveAttribute('readonly');

    await user.click(screen.getByRole('button', { name: `${ButtonsI18nKey.Open} schemaPrompt` }));
    expect(screen.getByRole('textbox', { name: 'schemaPrompt' })).toHaveValue('schema value');
    fireEvent.change(screen.getByRole('textbox', { name: 'schemaPrompt' }), { target: { value: 'discard me' } });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Cancel }));
    await user.click(screen.getByRole('button', { name: `${ButtonsI18nKey.Open} userPrompt` }));
    expect(screen.getByRole('textbox', { name: 'userPrompt' })).toHaveValue('  first\n\nsecond  \n');
  });

  test('switches a user row between string and number editors', async () => {
    const user = userEvent.setup();
    const onChangeProperties = vi.fn();
    const Harness = () => {
      const [properties, setProperties] = useState<Record<string, unknown>>({ prompt: 'text' });
      return (
        <TableView
          applicationProperties={properties}
          schemeProperties={[]}
          onChangeProperties={(next) => {
            onChangeProperties(next);
            setProperties(next);
          }}
          onValidityChange={vi.fn()}
          isAddClicked={false}
          setIsAddClicked={vi.fn()}
        />
      );
    };
    render(<Harness />);
    expect(screen.getByRole('textbox', { name: 'prompt' })).toHaveValue('text');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Type prompt' }), TypeEntity.NUMBER);
    expect(screen.getByRole('spinbutton')).toHaveValue(0);
    expect(screen.queryByRole('button', { name: `${ButtonsI18nKey.Open} prompt` })).toBeNull();
    expect(onChangeProperties).toHaveBeenLastCalledWith({ prompt: 0 });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Type prompt' }), TypeEntity.STRING);
    expect(screen.getByRole('textbox', { name: 'prompt' })).toHaveValue('');
  });

  test('restores the external value when the table is remounted after discard', async () => {
    const user = userEvent.setup();
    const onChangeProperties = vi.fn();
    const props = {
      applicationProperties: initialProperties,
      schemeProperties,
      onChangeProperties,
      onValidityChange: vi.fn(),
      isAddClicked: false,
      setIsAddClicked: vi.fn(),
    };
    const { rerender } = render(<TableView key={0} {...props} />);
    await user.click(screen.getByRole('button', { name: `${ButtonsI18nKey.Open} userPrompt` }));
    fireEvent.change(screen.getByRole('textbox', { name: 'userPrompt' }), {
      target: { value: 'edited\nvalue\n' },
    });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Apply }));
    const editedProperties = { ...initialProperties, userPrompt: 'edited\nvalue\n' };
    expect(onChangeProperties).toHaveBeenLastCalledWith(editedProperties);
    rerender(<TableView key={0} {...props} applicationProperties={editedProperties} />);
    expect(screen.getByRole('textbox', { name: 'userPrompt' })).toHaveAttribute('readonly');
    rerender(<TableView key={1} {...props} />);
    expect(screen.getByRole('textbox', { name: 'userPrompt' })).toHaveValue('user value');
  });
});
