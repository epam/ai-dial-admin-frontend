import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import AdaptiveValueGrid from '../AdaptiveValueGrid';
import AdaptiveValueRow from '../AdaptiveValueRow';

describe('AdaptiveValueGrid', () => {
  test('Should render title and entries', () => {
    const entries: [string, string][] = [
      ['answer', 'nappe formations'],
      ['question', 'What differs?'],
    ];
    render(<AdaptiveValueGrid title="Test case data" entries={entries} />);

    expect(screen.getByText('Test case data')).toBeInTheDocument();
    expect(screen.getByText('answer')).toBeInTheDocument();
    expect(screen.getByText('nappe formations')).toBeInTheDocument();
  });

  test('Should not render when entries are empty', () => {
    const { container } = render(<AdaptiveValueGrid title="Empty" entries={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('AdaptiveValueRow', () => {
  test('Should render short value inline', () => {
    render(<AdaptiveValueRow label="key" value="short" />);

    expect(screen.getByText('key')).toBeInTheDocument();
    expect(screen.getByText('short')).toBeInTheDocument();
  });

  test('Should show type chip for array values', () => {
    render(<AdaptiveValueRow label="items" value='["a","b","c"]' />);

    expect(screen.getByText('Array\u00B73')).toBeInTheDocument();
  });

  test('Should expand long value on click', () => {
    const longValue = 'a'.repeat(200);
    render(<AdaptiveValueRow label="text" value={longValue} />);

    const row = screen.getByText('text').closest('[role="button"]');
    expect(row).toBeTruthy();
    fireEvent.click(row!);

    expect(screen.getByText(longValue)).toBeInTheDocument();
  });

  test('Should copy value on button click', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { container } = render(<AdaptiveValueRow label="key" value="value" />);

    const copyBtn = container.querySelector('button');
    expect(copyBtn).toBeTruthy();
    fireEvent.click(copyBtn!);

    expect(writeText).toHaveBeenCalledWith('value');
  });
});
