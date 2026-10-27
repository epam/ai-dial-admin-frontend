import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import InputPopup from '@/src/components/Common/InputPopup/InputPopup';
import { InputPopupProps } from '@/src/components/Common/InputPopup/models';

const renderPopup = (props: Partial<InputPopupProps> = {}) => {
  const onOpen = vi.fn();
  render(
    <InputPopup selectedValue="Github (1.2.1)" elementId="image" onOpen={onOpen} {...props}>
      <div role="dialog">Modal</div>
    </InputPopup>,
  );
  return { onOpen };
};

describe('InputPopup', () => {
  test('Should show the selected value and open only from the icon button', () => {
    const { onOpen } = renderPopup();

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Github (1.2.1)');
    fireEvent.click(input);

    expect(onOpen).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button'));

    expect(onOpen).toHaveBeenCalledOnce();
  });

  test('Should not open when disabled', () => {
    const { onOpen } = renderPopup({ disabled: true });

    fireEvent.click(screen.getByRole('textbox'));

    expect(onOpen).not.toHaveBeenCalled();
  });

  test('Should show the empty value text as placeholder', () => {
    renderPopup({ selectedValue: '', emptyValueText: 'None' });

    expect(screen.getByPlaceholderText('None')).toBeInTheDocument();
  });

  test('Should prefer the placeholder over the empty value text', () => {
    renderPopup({ selectedValue: '', emptyValueText: 'None', placeholder: 'Select' });

    expect(screen.getByPlaceholderText('Select')).toBeInTheDocument();
  });

  test('Should show the error text', () => {
    renderPopup({ errorText: 'Required' });

    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  test('Should render the leading icon', () => {
    renderPopup({ iconBefore: <span>warning</span> });

    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  test('Should render the modal only while open', () => {
    const { unmount } = render(
      <InputPopup onOpen={vi.fn()}>
        <div role="dialog">Modal</div>
      </InputPopup>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    unmount();

    renderPopup({ open: true });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('Should report edits in editable mode and open from the button', () => {
    const onValueChange = vi.fn();
    const { onOpen } = renderPopup({ editable: true, onValueChange });

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onValueChange).toHaveBeenCalledWith('new');
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('Should show tags for an array value and open from the overlay button', () => {
    const { onOpen } = renderPopup({ selectedValue: ['alpha', 'beta'] });

    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
