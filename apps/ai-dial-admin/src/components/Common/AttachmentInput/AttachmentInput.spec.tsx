import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, test, vi } from 'vitest';

import AttachmentInput from './AttachmentInput';
import { AttachmentsI18nKey } from '@/src/constants/i18n';

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

const options = [
  { label: 'PDF', value: 'pdf' },
  { label: 'DOC', value: 'doc' },
  { label: 'ZIP', value: 'zip' },
];

describe('Common components - AttachmentInput', () => {
  test('renders tags from initialValues', () => {
    render(<AttachmentInput availableItems={options} initialValues={['pdf']} />);

    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AttachmentsI18nKey.UseAll })).toBeInTheDocument();
  });

  test('filters suggestions while typing and adds one on click', async () => {
    const onChange = vi.fn();
    render(<AttachmentInput availableItems={options} onChange={onChange} />);

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
    const onChange = vi.fn();
    render(<AttachmentInput availableItems={options} onChange={onChange} allValueLabel="ALL VALUES" />);

    const allButton = screen.getByRole('button', { name: AttachmentsI18nKey.UseAll });

    await userEvent.click(allButton);

    expect(onChange).toHaveBeenLastCalledWith(['*/*']);
  });
});
