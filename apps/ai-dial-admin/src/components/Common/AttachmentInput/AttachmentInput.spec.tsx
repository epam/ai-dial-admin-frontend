import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { AttachmentsI18nKey } from '@/src/constants/i18n';

import AttachmentInput, { AttachmentType, Props } from './AttachmentInput';

const options = [
  { label: 'PDF', value: 'pdf' },
  { label: 'DOC', value: 'doc' },
  { label: 'ZIP', value: 'zip' },
];
const placeHolder = 'Attachment Input';

const onChange = vi.fn();

// Wrapper component to simulate controlled behavior
const ControlledAttachmentInput = (props: Partial<Props> & { initialValues?: string[] }) => {
  const [values, setValues] = useState<string[] | undefined>(props.initialValues);

  const handleChange = (newValues?: string[], type?: AttachmentType) => {
    setValues(newValues);
    onChange(newValues, type);
  };

  return (
    <AttachmentInput
      {...props}
      availableItems={options}
      onChange={handleChange}
      placeholder={placeHolder}
      initialValues={values}
    />
  );
};

describe('Common components - AttachmentInput', () => {
  test('renders tags from initialValues', () => {
    renderComponent({ initialValues: ['pdf'] });

    expect(screen.getByText('pdf')).toBeInTheDocument();
    expect(screen.getByLabelText(AttachmentsI18nKey.SpecificAttachments)).toBeChecked();
  });

  test('selects "No attachments" when initialValues is an empty array', () => {
    renderComponent({ initialValues: [] });

    expect(screen.getByLabelText(AttachmentsI18nKey.NoAttachments)).toBeChecked();
    expect(screen.queryByText(AttachmentsI18nKey.SpecificAttachmentsRequired)).not.toBeInTheDocument();
  });

  test('filters suggestions while typing and adds one on click', async () => {
    renderComponent();
    await userEvent.click(screen.getByLabelText(AttachmentsI18nKey.SpecificAttachments));

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'doc');

    const list = await screen.findByRole('list');
    const suggestion = within(list).getAllByText((_, node) => !!node?.textContent?.startsWith('DOC'))[1];
    expect(suggestion).toBeInTheDocument();

    await userEvent.click(suggestion);

    expect(onChange).toHaveBeenLastCalledWith(['doc'], void 0);
    expect(screen.queryByRole('list ')).toBeNull();
  });

  test('selects all items with the “Select all” button and resets on remove', async () => {
    renderComponent();

    const allRadio = screen.getByLabelText(AttachmentsI18nKey.AllAttachments);

    await userEvent.click(allRadio);

    expect(onChange).toHaveBeenLastCalledWith(['*/*'], AttachmentType.ALL);
  });

  test('opens suggestion list when typing', async () => {
    renderComponent();

    await userEvent.click(screen.getByLabelText(AttachmentsI18nKey.SpecificAttachments));

    const input = screen.getByPlaceholderText(placeHolder);

    await userEvent.type(input, 'p');

    await waitFor(() => {
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });
  });

  test('toggles suggestion list based on typing and blur', async () => {
    renderComponent();

    await userEvent.click(screen.getByLabelText(AttachmentsI18nKey.SpecificAttachments));

    const input = screen.getByPlaceholderText(placeHolder);

    await userEvent.type(input, 'p');

    await waitFor(() => {
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });

    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByText('PDF')).not.toBeInTheDocument();
      expect(screen.queryByText('DOC')).not.toBeInTheDocument();
      expect(screen.queryByText('ZIP')).not.toBeInTheDocument();
    });
  });

  test('shows required error when Specific is selected with no types', async () => {
    renderComponent();

    await userEvent.click(screen.getByLabelText(AttachmentsI18nKey.SpecificAttachments));

    expect(screen.getByText(AttachmentsI18nKey.SpecificAttachmentsRequired)).toBeInTheDocument();
  });

  test('clears required error after adding an attachment type', async () => {
    renderComponent();

    await userEvent.click(screen.getByLabelText(AttachmentsI18nKey.SpecificAttachments));

    const input = screen.getByPlaceholderText(placeHolder);
    await userEvent.type(input, 'pdf{enter}');

    expect(screen.queryByText(AttachmentsI18nKey.SpecificAttachmentsRequired)).not.toBeInTheDocument();
  });

  test('clears All selection when switching to Specific', async () => {
    renderComponent();

    const allRadio = screen.getByLabelText(AttachmentsI18nKey.AllAttachments);

    await userEvent.click(allRadio);

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(['*/*'], AttachmentType.ALL);
    });

    await userEvent.click(screen.getByLabelText(AttachmentsI18nKey.SpecificAttachments));

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith([], AttachmentType.SPECIFIC);

      const input = screen.getByPlaceholderText(placeHolder);
      expect(input).toBeInTheDocument();
    });
  });
});

function renderComponent(extra: Partial<Props> = {}) {
  return render(<ControlledAttachmentInput {...extra} />);
}
