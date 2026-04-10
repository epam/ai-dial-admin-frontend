import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import AdaptiveValueGrid from '../AdaptiveValueGrid';
import AdaptiveValueRow from '../AdaptiveValueRow';

describe('AdaptiveValueGrid', () => {
  test('Should render title on initial mount (collapsed)', () => {
    const entries: [string, string][] = [
      ['answer', 'nappe formations'],
      ['question', 'What differs?'],
    ];
    render(<AdaptiveValueGrid title="Test case data" entries={entries} />);

    expect(screen.getByText('Test case data')).toBeInTheDocument();
    expect(screen.queryByText('nappe formations')).not.toBeInTheDocument();
    expect(screen.queryByText('answer')).not.toBeInTheDocument();
  });

  test('Should expand entries when title button is clicked', () => {
    const entries: [string, string][] = [
      ['answer', 'nappe formations'],
      ['question', 'What differs?'],
    ];
    render(<AdaptiveValueGrid title="Test case data" entries={entries} />);

    fireEvent.click(screen.getByText('Test case data'));

    expect(screen.getByText('answer')).toBeInTheDocument();
    expect(screen.getByText('nappe formations')).toBeInTheDocument();
  });

  test('Should collapse entries when title button is clicked again', () => {
    const entries: [string, string][] = [['answer', 'nappe formations']];
    render(<AdaptiveValueGrid title="Test case data" entries={entries} />);

    const toggle = screen.getByText('Test case data');
    fireEvent.click(toggle);
    expect(screen.getByText('nappe formations')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText('nappe formations')).not.toBeInTheDocument();
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

  test('Should render string-array value as stacked items', () => {
    render(<AdaptiveValueRow label="tags" value={['alpha', 'beta', 'gamma']} />);

    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('beta')).toBeInTheDocument();
    expect(screen.getByText('gamma')).toBeInTheDocument();
  });

  test('Should show only first 3 items and "more" indicator for long arrays', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    render(<AdaptiveValueRow label="tags" value={items} />);

    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
    expect(screen.getByText('c')).toBeInTheDocument();
    expect(screen.queryByText('d')).not.toBeInTheDocument();
    expect(screen.getByText('... and 2 more')).toBeInTheDocument();
  });

  test('Should expand long array on click and show all items', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    render(<AdaptiveValueRow label="tags" value={items} />);

    const row = screen.getByText('tags').closest('[role="button"]');
    expect(row).toBeTruthy();
    fireEvent.click(row!);

    expect(screen.getByText('d')).toBeInTheDocument();
    expect(screen.getByText('e')).toBeInTheDocument();
    expect(screen.queryByText('... and 2 more')).not.toBeInTheDocument();
  });

  test('Should copy newline-joined string for string-array value', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { container } = render(<AdaptiveValueRow label="tags" value={['a', 'b']} />);

    const copyBtn = container.querySelector('button');
    expect(copyBtn).toBeTruthy();
    fireEvent.click(copyBtn!);

    expect(writeText).toHaveBeenCalledWith('a\nb');
  });
});
