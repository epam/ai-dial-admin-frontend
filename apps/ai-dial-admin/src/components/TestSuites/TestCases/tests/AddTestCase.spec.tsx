import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import AddTestCase from '../AddTestCase';
import { ButtonsI18nKey } from '@/src/constants/i18n';

// Mock DialFormPopup component
vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialFormPopup: ({ open, header, onClose, onSubmit, onCancel, submitLabel, cancelLabel, children }: any) => (
    <>
      {open && (
        <div role="dialog" aria-label={header}>
          <div>Header: {header}</div>
          <div>{children}</div>
          <button onClick={onSubmit}>{submitLabel}</button>
          <button onClick={onCancel}>{cancelLabel}</button>
          <button onClick={onClose} aria-label="Close dialog">
            ×
          </button>
        </div>
      )}
    </>
  ),
}));

describe('AddTestCase', () => {
  const mockOnClose = vi.fn();
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders modal when isModalOpen is true', () => {
    render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('does not render modal when isModalOpen is false', () => {
    render(<AddTestCase isModalOpen={false} onClose={mockOnClose} onAdd={mockOnAdd} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('displays correct header text', () => {
    render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    expect(screen.getByText('Header: add test case')).toBeInTheDocument();
  });

  test('renders Add button with correct label', () => {
    render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    expect(screen.getByText(ButtonsI18nKey.Add)).toBeInTheDocument();
  });

  test('renders Cancel button with correct label', () => {
    render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    expect(screen.getByText(ButtonsI18nKey.Cancel)).toBeInTheDocument();
  });

  test('renders form placeholder content', () => {
    render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    expect(screen.getByText('Add Test Case Form')).toBeInTheDocument();
  });

  test('calls onAdd when submit button is clicked', () => {
    render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    const submitButton = screen.getByText(ButtonsI18nKey.Add);
    fireEvent.click(submitButton);

    expect(mockOnAdd).toHaveBeenCalledTimes(1);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('calls onClose when cancel button is clicked', () => {
    render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    const cancelButton = screen.getByText(ButtonsI18nKey.Cancel);
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  test('calls onClose when close (×) button is clicked', () => {
    render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  test('modal has correct aria-label', () => {
    render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'add test case');
  });

  test('can toggle modal open and closed', () => {
    const { rerender } = render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    rerender(<AddTestCase isModalOpen={false} onClose={mockOnClose} onAdd={mockOnAdd} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('multiple clicks on submit call onAdd multiple times', () => {
    render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    const submitButton = screen.getByText(ButtonsI18nKey.Add);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(mockOnAdd).toHaveBeenCalledTimes(3);
  });

  test('multiple clicks on cancel call onClose multiple times', () => {
    render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    const cancelButton = screen.getByText(ButtonsI18nKey.Cancel);
    fireEvent.click(cancelButton);
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  test('renders all buttons when modal is open', () => {
    render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    expect(screen.getByText(ButtonsI18nKey.Add)).toBeInTheDocument();
    expect(screen.getByText(ButtonsI18nKey.Cancel)).toBeInTheDocument();
    expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
  });

  test('does not call callbacks when modal is closed', () => {
    render(<AddTestCase isModalOpen={false} onClose={mockOnClose} onAdd={mockOnAdd} />);

    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  test('renders with different callback functions', () => {
    const altOnClose = vi.fn();
    const altOnAdd = vi.fn();

    render(<AddTestCase isModalOpen={true} onClose={altOnClose} onAdd={altOnAdd} />);

    const submitButton = screen.getByText(ButtonsI18nKey.Add);
    fireEvent.click(submitButton);

    expect(altOnAdd).toHaveBeenCalledTimes(1);
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  test('maintains modal state across rerenders', () => {
    const { rerender } = render(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Rerender with same props
    rerender(<AddTestCase isModalOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add Test Case Form')).toBeInTheDocument();
  });
});
