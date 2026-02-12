import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { useState } from 'react';

import { AttachmentsI18nKey } from '@/src/constants/i18n';

import AttachmentInput, { Props } from './AttachmentInput';

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

  const handleChange = (newValues?: string[]) => {
    setValues(newValues);
    onChange(newValues);
  };

  return <AttachmentInput {...props} availableItems={options} onChange={handleChange} placeholder={placeHolder} initialValues={values} />;
};

describe('Common components - AttachmentInput', () => {
  beforeAll(() => {
    const resizeObserverMock = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    global.ResizeObserver = resizeObserverMock;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('renders tags from initialValues', () => {
    renderComponent({ initialValues: ['pdf'] });

    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByLabelText(AttachmentsI18nKey.SpecificAttachments)).toBeChecked();
  });

  test('filters suggestions while typing and adds one on click', async () => {
    renderComponent();
    await userEvent.click(screen.getByLabelText(AttachmentsI18nKey.SpecificAttachments));

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'doc');

    const list = await screen.findByRole('list');
    const suggestion = within(list).getAllByText((_, node) => node?.textContent?.startsWith('DOC'))[1];
    expect(suggestion).toBeInTheDocument();

    await userEvent.click(suggestion);

    expect(onChange).toHaveBeenLastCalledWith(['doc']);
    expect(screen.queryByRole('list ')).toBeNull();
  });

  test('selects all items with the “Select all” button and resets on remove', async () => {
    renderComponent();

    const allRadio = screen.getByLabelText(AttachmentsI18nKey.AllAttachments);

    await userEvent.click(allRadio);

    expect(onChange).toHaveBeenLastCalledWith(['*/*']);
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

  test('clears All selection when switching to Specific', async () => {
    renderComponent();

    const allRadio = screen.getByLabelText(AttachmentsI18nKey.AllAttachments);

    await userEvent.click(allRadio);

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(['*/*']);
    });

    await userEvent.click(screen.getByLabelText(AttachmentsI18nKey.SpecificAttachments));

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith([]);

      const input = screen.getByPlaceholderText(placeHolder);
      expect(input).toBeInTheDocument();
    });
  });
});

function renderComponent(extra: Partial<Props> = {}) {
  return render(<ControlledAttachmentInput {...extra} />);
}
