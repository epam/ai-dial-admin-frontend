import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import AttachmentInput from './AttachmentInput';

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

describe('Common components – AttachmentInput', () => {
  it('renders tags from initialValues', () => {
    render(<AttachmentInput availableItems={options} initialValues={['pdf']} />);

    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buttons.UseAll' })).toBeInTheDocument();
  });

  it('filters suggestions while typing and adds one on click', async () => {
    const onChange = vi.fn();
    render(<AttachmentInput availableItems={options} onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'doc');

    const suggestion = screen.getByText('DOC');
    expect(suggestion).toBeInTheDocument();

    await userEvent.click(suggestion);

    expect(screen.getByText('DOC')).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(['doc']);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('selects all items with the “Select all” button and resets on remove', async () => {
    const onChange = vi.fn();
    render(<AttachmentInput availableItems={options} onChange={onChange} allValueLabel="ALL VALUES" />);

    await userEvent.click(screen.getByRole('button', { name: 'Buttons.UseAll' }));

    expect(screen.getByText('ALL VALUES')).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(['*/*']);

    await userEvent.click(screen.getByRole('button'));

    expect(screen.queryByText('ALL VALUES')).toBeNull();
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('adds a suggestion using keyboard navigation (↓ + Enter)', async () => {
    render(<AttachmentInput availableItems={options} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'z');

    await userEvent.keyboard('{ArrowDown}{Enter}');

    expect(screen.getByText('ZIP')).toBeInTheDocument();
  });

  it('removes an individual tag when its “x” is clicked', async () => {
    render(<AttachmentInput availableItems={options} initialValues={['pdf', 'doc']} />);

    await userEvent.click(screen.getAllByTestId('tag')[0].children[1]);
    expect(screen.queryByText('PDF')).toBeNull();

    expect(screen.getByText('DOC')).toBeInTheDocument();
  });
});
