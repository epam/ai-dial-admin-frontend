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
    render(<ExportConfig enableExportConfigMap={true} />);
    expect(screen.getByText(/ExportConfig/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
