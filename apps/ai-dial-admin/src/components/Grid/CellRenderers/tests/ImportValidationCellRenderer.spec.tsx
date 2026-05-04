import { render, screen } from '@testing-library/react';
import type { ICellRendererParams } from 'ag-grid-community';
import type { ReactNode } from 'react';
import { describe, expect, test, vi } from 'vitest';

import ImportValidationCellRenderer from '../ImportValidationCellRenderer';
import { BasicI18nKey } from '@/src/constants/i18n';
import { ROW_IMPORT_META_KEY } from '@/src/constants/import';
import { ExportConfigComponentType, ValidationState } from '@/src/types/deployments/import';

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialTooltip: ({
      children,
      tooltip,
      triggerClassName,
    }: {
      children: ReactNode;
      tooltip?: ReactNode;
      triggerClassName?: string;
    }) => (
      <span className={triggerClassName}>
        {children}
        <span data-testid="tooltip-content">{tooltip}</span>
      </span>
    ),
  };
});

const params = (data: Record<string, unknown> | undefined): ICellRendererParams =>
  ({ data, value: data?.[ROW_IMPORT_META_KEY] }) as unknown as ICellRendererParams;

describe('ImportValidationCellRenderer', () => {
  test('renders nothing when row has no __import meta', () => {
    const { container } = render(<ImportValidationCellRenderer {...params({})} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('VALIDATED row: green check icon + Validated label, no tooltip trigger', () => {
    const { container } = render(
      <ImportValidationCellRenderer
        {...params({
          [ROW_IMPORT_META_KEY]: {
            entityIdentifier: 'echo',
            validationState: ValidationState.VALIDATED,
            validationErrors: [],
          },
        })}
      />,
    );
    expect(screen.getByText(BasicI18nKey.Validated)).toBeInTheDocument();
    expect(container.querySelector('.text-success')).toBeInTheDocument();
    expect(container.querySelector('.text-error')).not.toBeInTheDocument();
    expect(container.querySelector('.text-secondary')).not.toBeInTheDocument();
  });

  test('FAILED row: red X icon + Failed label + right-aligned gray info icon with tooltip lines', () => {
    const { container } = render(
      <ImportValidationCellRenderer
        {...params({
          [ROW_IMPORT_META_KEY]: {
            entityIdentifier: 'echo',
            validationState: ValidationState.FAILED,
            validationErrors: [
              {
                entityType: ExportConfigComponentType.MCP_DEPLOYMENT,
                entityIdentifier: 'echo',
                fieldPath: 'name',
                message: 'invalid',
              },
              {
                entityType: ExportConfigComponentType.MCP_DEPLOYMENT,
                entityIdentifier: 'echo',
                fieldPath: 'displayName',
                message: 'must not be null',
              },
            ],
          },
        })}
      />,
    );
    expect(screen.getByText(BasicI18nKey.Failed)).toBeInTheDocument();
    expect(container.querySelector('.text-error')).toBeInTheDocument();
    expect(container.querySelector('.text-secondary')).toBeInTheDocument();
    expect(container.querySelector('.ml-auto')).toBeInTheDocument();
    expect(screen.getByText('name: invalid')).toBeInTheDocument();
    expect(screen.getByText('displayName: must not be null')).toBeInTheDocument();
  });

  test('FAILED row with empty fieldPath renders message-only line', () => {
    render(
      <ImportValidationCellRenderer
        {...params({
          [ROW_IMPORT_META_KEY]: {
            entityIdentifier: 'echo',
            validationState: ValidationState.FAILED,
            validationErrors: [
              {
                entityType: ExportConfigComponentType.MCP_DEPLOYMENT,
                entityIdentifier: 'echo',
                fieldPath: '',
                message: 'Mapping failed: NPE',
              },
            ],
          },
        })}
      />,
    );
    expect(screen.getByText('Mapping failed: NPE')).toBeInTheDocument();
  });
});
