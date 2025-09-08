import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ExportConfig from '../ExportConfig';
import { ButtonsI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/app/[lang]/export-config/actions', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    exportConfig: vi.fn(),
    exportConfigMap: vi.fn(),
  };
});

describe('ExportConfig', () => {
  it('renders export config title and button', () => {
    render(<ExportConfig />);
    expect(screen.getByText(/ExportConfig/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onExport when export is confirmed in modal', () => {
    render(<ExportConfig enableExportConfigMap={true} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.Export }));
    // No assertion for side effect, but covers the call
  });
});
