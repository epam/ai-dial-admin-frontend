import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import DatasetBinding from '../DatasetBinding';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import * as datasetsActions from '@/src/app/[lang]/datasets/actions';
import * as testSuitesActions from '@/src/app/[lang]/test-suites/actions';
import { TestSuitesI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  createDataset: vi.fn(),
}));

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  updateTestSuite: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock('../PickPublicDataset', () => ({
  default: ({ isOpen, onClose, onConfirm }: any) =>
    isOpen ? (
      <div>
        <div>PickPublicDataset Modal</div>
        <button onClick={onClose}>Close Pick</button>
        <button onClick={() => onConfirm('picked-dataset-id')}>Confirm Pick</button>
      </div>
    ) : null,
}));

const mockSuite: TestSuite = { id: 'suite-1', name: 'Suite 1' };

describe('DatasetBinding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders "Pick public dataset" and "Create private dataset" buttons', () => {
    render(<DatasetBinding selectedTestSuite={mockSuite} suiteEtag="" />);

    expect(screen.getByText(TestSuitesI18nKey.PickPublicDataset)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.CreatePrivateDataset)).toBeInTheDocument();
  });

  test('create-private success: calls createDataset with DATASET_{suiteId}', async () => {
    vi.mocked(datasetsActions.createDataset).mockResolvedValue({ success: true });

    render(<DatasetBinding selectedTestSuite={mockSuite} suiteEtag="" />);

    fireEvent.click(screen.getByText(TestSuitesI18nKey.CreatePrivateDataset));

    await waitFor(() => {
      expect(datasetsActions.createDataset).toHaveBeenCalledWith(expect.objectContaining({ name: 'DATASET_suite-1' }));
    });

    expect(testSuitesActions.updateTestSuite).not.toHaveBeenCalled();
  });

  test('create-private failure does not call updateTestSuite', async () => {
    vi.mocked(datasetsActions.createDataset).mockResolvedValue({
      success: false,
      errorHeader: 'Error',
      errorMessage: 'Failed to create',
    });

    render(<DatasetBinding selectedTestSuite={mockSuite} suiteEtag="" />);

    fireEvent.click(screen.getByText(TestSuitesI18nKey.CreatePrivateDataset));

    await waitFor(() => {
      expect(datasetsActions.createDataset).toHaveBeenCalled();
    });

    expect(testSuitesActions.updateTestSuite).not.toHaveBeenCalled();
  });

  test('pick-public cancel: opens modal then closes without calling updateTestSuite', async () => {
    render(<DatasetBinding selectedTestSuite={mockSuite} suiteEtag="" />);

    fireEvent.click(screen.getByText(TestSuitesI18nKey.PickPublicDataset));
    expect(screen.getByText('PickPublicDataset Modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close Pick'));
    expect(screen.queryByText('PickPublicDataset Modal')).not.toBeInTheDocument();

    expect(testSuitesActions.updateTestSuite).not.toHaveBeenCalled();
  });

  test('pick-public confirm: calls updateTestSuite with selected datasetId', async () => {
    vi.mocked(testSuitesActions.updateTestSuite).mockResolvedValue({ success: true });

    render(<DatasetBinding selectedTestSuite={mockSuite} suiteEtag="" />);

    fireEvent.click(screen.getByText(TestSuitesI18nKey.PickPublicDataset));
    fireEvent.click(screen.getByText('Confirm Pick'));

    await waitFor(() => {
      expect(testSuitesActions.updateTestSuite).toHaveBeenCalledWith(
        expect.objectContaining({ datasetId: 'picked-dataset-id' }),
        '',
      );
    });
  });
});
