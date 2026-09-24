import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { APPLICATION_ZIP_TYPES } from '@/src/constants/request-headers';
import ImportFileModal from '../ImportFile';

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  importTestCasePreview: vi.fn(),
}));

describe('ImportFileModal', () => {
  test('accepts both CSV and ZIP files on the initial file picker', () => {
    render(
      <ImportFileModal
        datasetId="dataset-1"
        isModalOpen={true}
        portalId="ImportFileModal"
        onClose={vi.fn()}
        onApply={vi.fn()}
      />,
    );

    const input = document.getElementById('file') as HTMLInputElement;
    expect(input.accept).toContain('text/csv');
    APPLICATION_ZIP_TYPES.forEach((type) => expect(input.accept).toContain(type));
  });
});
