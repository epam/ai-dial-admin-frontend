import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import ExportConfig from '../ExportConfig';

vi.mock('@/src/app/[lang]/export-config/actions', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    exportConfig: vi.fn(),
    exportConfigMap: vi.fn(),
  };
});

describe('ExportConfig', () => {
  test('renders export config title and button', () => {
    render(<ExportConfig enableExportConfigMap={true} />);
    expect(screen.getByText(/ExportConfig/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
