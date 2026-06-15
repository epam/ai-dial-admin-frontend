import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import HeaderButtons from '../Header';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

// Mock the "More" button dropdown so its items are queryable/clickable as buttons.
vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();
  return {
    ...actual,
    DialButtonDropdown: ({ label, items }: any) => (
      <div>
        <span>{label}</span>
        {items?.map((item: any) => (
          <button key={item.key} onClick={() => item.onClick?.({ key: item.key })}>
            {item.label}
          </button>
        ))}
      </div>
    ),
  };
});

// Mock child components
vi.mock('../Import/ImportFile', () => ({
  default: ({ datasetId, isModalOpen, onClose, onApply }: any) => (
    <>
      {isModalOpen && (
        <div>
          <div>Import File Modal</div>
          <div>Test Suite ID: {datasetId}</div>
          <button onClick={onClose}>Close Import Modal</button>
          <button onClick={onApply}>Apply Import</button>
        </div>
      )}
    </>
  ),
}));

vi.mock('../PickPublicDataset', () => ({
  default: ({ isOpen, onClose, onConfirm }: any) =>
    isOpen ? (
      <div>
        <div>Pick Public Dataset Modal</div>
        <button onClick={onClose}>Close Attach Modal</button>
        <button onClick={() => onConfirm('picked-dataset')}>Confirm Attach</button>
      </div>
    ) : null,
}));

vi.mock('../PublishDatasetModal', () => ({
  default: ({ isOpen, onClose, onConfirm }: any) =>
    isOpen ? (
      <div>
        <div>Publish Dataset Modal</div>
        <button onClick={onClose}>Close Publish Modal</button>
        <button onClick={() => onConfirm('display-name', 'description')}>Confirm Publish</button>
      </div>
    ) : null,
}));

describe('HeaderButtons', () => {
  const mockTestSuiteId = 'test-suite-123';
  const mockOnApplyImport = vi.fn();

  const openImportModal = () => {
    const importItem = screen.getByText(TestSuitesI18nKey.ImportFromPC);
    fireEvent.click(importItem);
  };

  test('renders More dropdown, Attach and Add buttons when editable', () => {
    render(<HeaderButtons datasetId={mockTestSuiteId} onApplyImport={mockOnApplyImport} />);

    expect(screen.getByText(TestSuitesI18nKey.More)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.AttachDataset)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Add)).toBeInTheDocument();
  });

  test('renders read-only actions when isReadOnly is true', () => {
    render(<HeaderButtons datasetId={mockTestSuiteId} onApplyImport={mockOnApplyImport} isReadOnly />);

    expect(screen.getByText(ButtonsI18nKey.ExportCsv)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.ChangeDataset)).toBeInTheDocument();
    expect(screen.getByText(TestSuitesI18nKey.DetachFromDataset)).toBeInTheDocument();
    expect(screen.queryByText(ButtonsI18nKey.Add)).not.toBeInTheDocument();
  });

  test('does not render modals initially', () => {
    render(<HeaderButtons datasetId={mockTestSuiteId} onApplyImport={mockOnApplyImport} />);

    expect(screen.queryByText('Import File Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Pick Public Dataset Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Publish Dataset Modal')).not.toBeInTheDocument();
  });

  test('calls onAdd callback when Add button is clicked', () => {
    const mockOnAdd = vi.fn();
    render(<HeaderButtons datasetId={mockTestSuiteId} onApplyImport={mockOnApplyImport} onAdd={mockOnAdd} />);

    fireEvent.click(screen.getByText(ButtonsI18nKey.Add));

    expect(mockOnAdd).toHaveBeenCalledTimes(1);
  });

  test('opens ImportFileModal when "Import from PC" item is clicked', () => {
    render(<HeaderButtons datasetId={mockTestSuiteId} onApplyImport={mockOnApplyImport} />);

    openImportModal();

    expect(screen.getByText('Import File Modal')).toBeInTheDocument();
  });

  test('passes datasetId to ImportFileModal', () => {
    render(<HeaderButtons datasetId={mockTestSuiteId} onApplyImport={mockOnApplyImport} />);

    openImportModal();

    expect(screen.getByText(`Test Suite ID: ${mockTestSuiteId}`)).toBeInTheDocument();
  });

  test('closes ImportFileModal when close is triggered', () => {
    render(<HeaderButtons datasetId={mockTestSuiteId} onApplyImport={mockOnApplyImport} />);

    openImportModal();
    expect(screen.getByText('Import File Modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close Import Modal'));
    expect(screen.queryByText('Import File Modal')).not.toBeInTheDocument();
  });

  test('keeps ImportFileModal open after apply action', () => {
    render(<HeaderButtons datasetId={mockTestSuiteId} onApplyImport={mockOnApplyImport} />);

    openImportModal();
    fireEvent.click(screen.getByText('Apply Import'));

    // Modal stays open; closing is handled inside ImportFileModal itself.
    expect(screen.getByText('Import File Modal')).toBeInTheDocument();
  });

  test('opens attach modal and forwards selected dataset on confirm', () => {
    const mockOnAttachDataset = vi.fn();
    render(
      <HeaderButtons
        datasetId={mockTestSuiteId}
        onApplyImport={mockOnApplyImport}
        onAttachDataset={mockOnAttachDataset}
      />,
    );

    fireEvent.click(screen.getByText(TestSuitesI18nKey.AttachDataset));
    expect(screen.getByText('Pick Public Dataset Modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirm Attach'));

    expect(mockOnAttachDataset).toHaveBeenCalledWith('picked-dataset');
    expect(screen.queryByText('Pick Public Dataset Modal')).not.toBeInTheDocument();
  });

  test('opens publish modal and forwards values on confirm', () => {
    const mockOnPublish = vi.fn();
    render(
      <HeaderButtons datasetId={mockTestSuiteId} onApplyImport={mockOnApplyImport} onPublish={mockOnPublish} />,
    );

    fireEvent.click(screen.getByText(TestSuitesI18nKey.PublishToDataset));
    expect(screen.getByText('Publish Dataset Modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirm Publish'));

    expect(mockOnPublish).toHaveBeenCalledWith('display-name', 'description');
    expect(screen.queryByText('Publish Dataset Modal')).not.toBeInTheDocument();
  });

  test('invokes onOpenSchemaModal from the More dropdown', () => {
    const mockOnOpenSchemaModal = vi.fn();
    render(
      <HeaderButtons
        datasetId={mockTestSuiteId}
        onApplyImport={mockOnApplyImport}
        onOpenSchemaModal={mockOnOpenSchemaModal}
      />,
    );

    fireEvent.click(screen.getByText(TestSuitesI18nKey.TestCaseSchema));

    expect(mockOnOpenSchemaModal).toHaveBeenCalledTimes(1);
  });

  test('invokes onExport from the More dropdown', () => {
    const mockOnExport = vi.fn();
    render(
      <HeaderButtons datasetId={mockTestSuiteId} onApplyImport={mockOnApplyImport} onExport={mockOnExport} />,
    );

    fireEvent.click(screen.getByText(ButtonsI18nKey.ExportCsv));

    expect(mockOnExport).toHaveBeenCalledTimes(1);
  });

  test('renders batch delete button only when showBatchDelete is true', () => {
    const mockOnBatchDelete = vi.fn();
    const { rerender } = render(
      <HeaderButtons
        datasetId={mockTestSuiteId}
        onApplyImport={mockOnApplyImport}
        onBatchDelete={mockOnBatchDelete}
      />,
    );

    expect(screen.queryByText(ButtonsI18nKey.Delete)).not.toBeInTheDocument();

    rerender(
      <HeaderButtons
        datasetId={mockTestSuiteId}
        onApplyImport={mockOnApplyImport}
        onBatchDelete={mockOnBatchDelete}
        showBatchDelete
      />,
    );

    fireEvent.click(screen.getByText(ButtonsI18nKey.Delete));
    expect(mockOnBatchDelete).toHaveBeenCalledTimes(1);
  });

  test('handles different datasetId values', () => {
    const { rerender } = render(<HeaderButtons datasetId="suite-1" onApplyImport={mockOnApplyImport} />);

    openImportModal();
    expect(screen.getByText('Test Suite ID: suite-1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close Import Modal'));
    rerender(<HeaderButtons datasetId="suite-2" onApplyImport={mockOnApplyImport} />);

    openImportModal();
    expect(screen.getByText('Test Suite ID: suite-2')).toBeInTheDocument();
  });
});
