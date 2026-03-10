import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import HeaderButtons from '../Header';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

// Mock child components
vi.mock('../AddTestCase', () => ({
  default: ({ isModalOpen, onClose, onAdd }: any) => (
    <>
      {isModalOpen && (
        <div>
          <div>Add Test Case Modal</div>
          <button onClick={onClose}>Close Add Modal</button>
          <button onClick={onAdd}>Add Test Case</button>
        </div>
      )}
    </>
  ),
}));

vi.mock('../Import/ImportFile', () => ({
  default: ({ selectedTestSuiteId, isModalOpen, onClose, onApply }: any) => (
    <>
      {isModalOpen && (
        <div>
          <div>Import File Modal</div>
          <div>Test Suite ID: {selectedTestSuiteId}</div>
          <button onClick={onClose}>Close Import Modal</button>
          <button onClick={onApply}>Apply Import</button>
        </div>
      )}
    </>
  ),
}));

describe('HeaderButtons', () => {
  const mockTestSuiteId = 'test-suite-123';

  test('renders Import and Add buttons', () => {
    render(<HeaderButtons selectedTestSuiteId={mockTestSuiteId} />);

    expect(screen.getByText(ButtonsI18nKey.Import)).toBeInTheDocument();
    // expect(screen.getByText(ButtonsI18nKey.Add)).toBeInTheDocument();
  });

  test('does not render modals initially', () => {
    render(<HeaderButtons selectedTestSuiteId={mockTestSuiteId} />);

    // expect(screen.queryByText('Add Test Case Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Import File Modal')).not.toBeInTheDocument();
  });

  test.skip('closes AddTestCase modal when close is triggered', () => {
    render(<HeaderButtons selectedTestSuiteId={mockTestSuiteId} />);

    // Open modal
    const addButton = screen.getByText(ButtonsI18nKey.Add);
    fireEvent.click(addButton);
    expect(screen.getByText('Add Test Case Modal')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('Close Add Modal');
    fireEvent.click(closeButton);
    expect(screen.queryByText('Add Test Case Modal')).not.toBeInTheDocument();
  });

  test('opens ImportFileModal when "From PC" is clicked', () => {
    render(<HeaderButtons selectedTestSuiteId={mockTestSuiteId} />);

    // Click import dropdown (assuming it's accessible via the Import button text)
    const importButton = screen.getByText(ButtonsI18nKey.Import);
    fireEvent.click(importButton);

    // Click "From PC" option
    const fromPCOption = screen.getByText(TestSuitesI18nKey.FromPC);
    fireEvent.click(fromPCOption);

    expect(screen.getByText('Import File Modal')).toBeInTheDocument();
  });

  test('passes selectedTestSuiteId to ImportFileModal', () => {
    render(<HeaderButtons selectedTestSuiteId={mockTestSuiteId} />);

    // Open import modal
    const importButton = screen.getByText(ButtonsI18nKey.Import);
    fireEvent.click(importButton);
    const fromPCOption = screen.getByText(TestSuitesI18nKey.FromPC);
    fireEvent.click(fromPCOption);

    expect(screen.getByText(`Test Suite ID: ${mockTestSuiteId}`)).toBeInTheDocument();
  });

  test('closes ImportFileModal when close is triggered', () => {
    render(<HeaderButtons selectedTestSuiteId={mockTestSuiteId} />);

    // Open import modal
    const importButton = screen.getByText(ButtonsI18nKey.Import);
    fireEvent.click(importButton);
    const fromPCOption = screen.getByText(TestSuitesI18nKey.FromPC);
    fireEvent.click(fromPCOption);
    expect(screen.getByText('Import File Modal')).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByText('Close Import Modal');
    fireEvent.click(closeButton);
    expect(screen.queryByText('Import File Modal')).not.toBeInTheDocument();
  });

  test('keeps ImportFileModal open after apply action', () => {
    render(<HeaderButtons selectedTestSuiteId={mockTestSuiteId} />);

    // Open import modal
    const importButton = screen.getByText(ButtonsI18nKey.Import);
    fireEvent.click(importButton);
    const fromPCOption = screen.getByText(TestSuitesI18nKey.FromPC);
    fireEvent.click(fromPCOption);

    // Trigger apply
    const applyButton = screen.getByText('Apply Import');
    fireEvent.click(applyButton);

    // Modal should still be visible (only closes via close button)
    expect(screen.getByText('Import File Modal')).toBeInTheDocument();
  });

  test.skip('can open both modals independently', () => {
    render(<HeaderButtons selectedTestSuiteId={mockTestSuiteId} />);

    // Open add modal
    const addButton = screen.getByText(ButtonsI18nKey.Add);
    fireEvent.click(addButton);
    expect(screen.getByText('Add Test Case Modal')).toBeInTheDocument();

    // Close add modal
    fireEvent.click(screen.getByText('Close Add Modal'));
    expect(screen.queryByText('Add Test Case Modal')).not.toBeInTheDocument();

    // Open import modal
    const importButton = screen.getByText(ButtonsI18nKey.Import);
    fireEvent.click(importButton);
    const fromPCOption = screen.getByText(TestSuitesI18nKey.FromPC);
    fireEvent.click(fromPCOption);
    expect(screen.getByText('Import File Modal')).toBeInTheDocument();
  });

  test.skip('renders buttons in correct order', () => {
    const { container } = render(<HeaderButtons selectedTestSuiteId={mockTestSuiteId} />);

    const buttons = container.querySelectorAll('button');
    const buttonTexts = Array.from(buttons).map((btn) => btn.textContent);

    // Import button should come before Add button
    const importIndex = buttonTexts.findIndex((text) => text?.includes(ButtonsI18nKey.Import));
    const addIndex = buttonTexts.findIndex((text) => text?.includes(ButtonsI18nKey.Add));

    expect(importIndex).toBeLessThan(addIndex);
  });

  test.skip('renders Add button with icon', () => {
    render(<HeaderButtons selectedTestSuiteId={mockTestSuiteId} />);

    const addButton = screen.getByText(ButtonsI18nKey.Add);
    expect(addButton).toBeInTheDocument();
    // Icon is rendered but we can't easily test it without test IDs
    // We verify the button is present which should include the icon
  });

  test('renders dropdown with "From PC" item', () => {
    render(<HeaderButtons selectedTestSuiteId={mockTestSuiteId} />);

    const importButton = screen.getByText(ButtonsI18nKey.Import);
    fireEvent.click(importButton);

    expect(screen.getByText(TestSuitesI18nKey.FromPC)).toBeInTheDocument();
  });

  test('handles different selectedTestSuiteId values', () => {
    const { rerender } = render(<HeaderButtons selectedTestSuiteId="suite-1" />);

    // Open import modal
    const importButton = screen.getByText(ButtonsI18nKey.Import);
    fireEvent.click(importButton);
    const fromPCOption = screen.getByText(TestSuitesI18nKey.FromPC);
    fireEvent.click(fromPCOption);

    expect(screen.getByText('Test Suite ID: suite-1')).toBeInTheDocument();

    // Close and rerender with different ID
    fireEvent.click(screen.getByText('Close Import Modal'));
    rerender(<HeaderButtons selectedTestSuiteId="suite-2" />);

    // Open import modal again
    fireEvent.click(screen.getByText(ButtonsI18nKey.Import));
    fireEvent.click(screen.getByText(TestSuitesI18nKey.FromPC));

    expect(screen.getByText('Test Suite ID: suite-2')).toBeInTheDocument();
  });
});
