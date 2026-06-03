import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import DatasetHeader from '../DatasetHeader';
import { Dataset, DatasetVisibility } from '@/src/models/evaluation/dataset';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { DatasetsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  transitionVisibility: vi.fn(),
}));

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  updateTestSuite: vi.fn(),
}));

const mockSuite: TestSuite = { id: 'suite-1', name: 'Suite 1', datasetId: 'dataset-abc' };

const privateDataset: Dataset = {
  id: 'dataset-abc',
  visibility: DatasetVisibility.PRIVATE,
};

const publicDataset: Dataset = {
  id: 'dataset-abc',
  visibility: DatasetVisibility.PUBLIC,
};

describe('DatasetHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders dataset ID', () => {
    render(<DatasetHeader dataset={privateDataset} selectedTestSuite={mockSuite} etag="" />);
    expect(screen.getByText('dataset-abc')).toBeInTheDocument();
  });

  test('shows PRIVATE badge for private dataset', () => {
    render(<DatasetHeader dataset={privateDataset} selectedTestSuite={mockSuite} etag="" />);
    expect(screen.getByText(DatasetsI18nKey.VisibilityPrivate)).toBeInTheDocument();
  });

  test('shows PUBLIC badge for public dataset', () => {
    render(<DatasetHeader dataset={publicDataset} selectedTestSuite={mockSuite} etag="" />);
    expect(screen.getByText(DatasetsI18nKey.VisibilityPublic)).toBeInTheDocument();
  });

  test('shows "Make Public" action button for PRIVATE dataset', () => {
    render(<DatasetHeader dataset={privateDataset} selectedTestSuite={mockSuite} etag="" />);
    expect(screen.getByText(DatasetsI18nKey.MakePublic)).toBeInTheDocument();
  });

  test('shows "Unbind" action button for PUBLIC dataset', () => {
    render(<DatasetHeader dataset={publicDataset} selectedTestSuite={mockSuite} etag="" />);
    expect(screen.getByText(TestSuitesI18nKey.UnbindDataset)).toBeInTheDocument();
  });

  test('open-in-new-tab link has correct href for PRIVATE dataset', () => {
    render(<DatasetHeader dataset={privateDataset} selectedTestSuite={mockSuite} etag="" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/datasets/dataset-abc');
  });

  test('open-in-new-tab link has correct href for PUBLIC dataset', () => {
    render(<DatasetHeader dataset={publicDataset} selectedTestSuite={mockSuite} etag="" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/datasets/dataset-abc');
  });

  test('shows private description for PRIVATE dataset', () => {
    render(<DatasetHeader dataset={privateDataset} selectedTestSuite={mockSuite} etag="" />);
    expect(screen.getByText(TestSuitesI18nKey.DatasetPrivateDescription)).toBeInTheDocument();
  });

  test('shows public description for PUBLIC dataset', () => {
    render(<DatasetHeader dataset={publicDataset} selectedTestSuite={mockSuite} etag="" />);
    expect(screen.getByText(TestSuitesI18nKey.DatasetPublicDescription)).toBeInTheDocument();
  });
});
