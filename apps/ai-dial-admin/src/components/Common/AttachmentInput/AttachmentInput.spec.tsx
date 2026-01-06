import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import { AttachmentsI18nKey } from '@/src/constants/i18n';

import AttachmentInput, { Props } from './AttachmentInput';

const options = [
  { label: 'PDF', value: 'pdf' },
  { label: 'DOC', value: 'doc' },
  { label: 'ZIP', value: 'zip' },
];
const placeHolder = 'Attachment Input';
const ALL_VALUES_LABEL = 'ALL VALUES';

const onChange = vi.fn();

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
    expect(screen.getByRole('button', { name: AttachmentsI18nKey.UseAll })).toBeInTheDocument();
  });

  test('filters suggestions while typing and adds one on click', async () => {
    renderComponent();

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

    const allButton = screen.getByRole('button', { name: AttachmentsI18nKey.UseAll });

    await userEvent.click(allButton);

    expect(onChange).toHaveBeenLastCalledWith(['*/*']);
  });

  test('opens suggestion list when clicked', async () => {
    renderComponent();

    const input = screen.getByPlaceholderText(placeHolder);

    await userEvent.click(input);

    await waitFor(() => {
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('DOC')).toBeInTheDocument();
      expect(screen.getByText('ZIP')).toBeInTheDocument();
    });
  });

  test('toggles suggestion list when user click on input and when input lost focus', async () => {
    renderComponent();

    const input = screen.getByPlaceholderText(placeHolder);

    await userEvent.click(input);

    await waitFor(() => {
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('DOC')).toBeInTheDocument();
      expect(screen.getByText('ZIP')).toBeInTheDocument();
    });

    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByText('PDF')).not.toBeInTheDocument();
      expect(screen.queryByText('PDF')).not.toBeInTheDocument();
      expect(screen.queryByText('PDF')).not.toBeInTheDocument();
    });
  });

  test('clears All Value - Tag selection when tag close button clicked', async () => {
    renderComponent();

    const useAllButton = screen.getByRole('button', { name: AttachmentsI18nKey.UseAll });

    fireEvent.click(useAllButton);

    await waitFor(() => {
      expect(screen.getByText(ALL_VALUES_LABEL)).toBeInTheDocument();
    });

    const allValuesClearBtn = screen.getByRole('button');

    await userEvent.click(allValuesClearBtn);

    await waitFor(() => {
      expect(screen.queryByText(ALL_VALUES_LABEL)).not.toBeInTheDocument();

      const input = screen.getByPlaceholderText(placeHolder);

      expect(input).toBeInTheDocument();
    });
  });
});

function renderComponent(extra: Partial<Props> = {}) {
  return render(
    <AttachmentInput
      availableItems={options}
      onChange={onChange}
      allValueLabel={ALL_VALUES_LABEL}
      placeholder={placeHolder}
      {...extra}
    />,
  );
}
