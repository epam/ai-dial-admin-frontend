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

    expect(screen.getByText('Array\u00B73')).toBeInTheDocument();
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

  test('Should render nested array items in readable JSON form', () => {
    render(<AdaptiveValueRow label="payload" value={['alpha', ['beta', 'gamma'], { key: 'value' }]} />);

    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('["beta","gamma"]')).toBeInTheDocument();
    expect(screen.getByText('{"key":"value"}')).toBeInTheDocument();
  });

  test('Should render array-of-objects items in readable JSON form', () => {
    render(
      <AdaptiveValueRow
        label="records"
        value={[
          { id: 1, name: 'alice' },
          { id: 2, active: true },
        ]}
      />,
    );

    expect(screen.getByText('{"id":1,"name":"alice"}')).toBeInTheDocument();
    expect(screen.getByText('{"id":2,"active":true}')).toBeInTheDocument();
  });

  test('Should clamp and expand array item when object element is large', () => {
    render(<AdaptiveValueRow label="records" value={[{ id: 1, payload: 'x'.repeat(180) }]} />);

    fireEvent.click(screen.getByText(/"payload":"x+/));

    expect(screen.getByText(/"payload":/)).toBeInTheDocument();
  });

  test('Should expand only clicked array object item', () => {
    render(
      <AdaptiveValueRow
        label="records"
        value={[
          { id: 1, payload: 'x'.repeat(180) },
          { id: 2, payload: 'y'.repeat(180) },
        ]}
      />,
    );

    fireEvent.click(screen.getByText(/"id":1,"payload":"x+/));

    expect(screen.getByText(/"id": 1/)).toBeInTheDocument();
    expect(screen.queryByText(/"id": 2/)).not.toBeInTheDocument();
  });

  test('Should keep long array items clamped after "show more" until item click', () => {
    const longPayload = 'x'.repeat(180);
    render(
      <AdaptiveValueRow
        label="records"
        value={[
          { id: 1, payload: longPayload },
          { id: 2, payload: longPayload },
          { id: 3, payload: longPayload },
          { id: 4, payload: longPayload },
        ]}
      />,
    );

    const row = screen.getByText('records').closest('[role="button"]');
    expect(row).toBeTruthy();
    fireEvent.click(row!);

    const compactFourthItem = screen.getByText(/"id":4,"payload":"x+/);
    expect(compactFourthItem).toHaveClass('line-clamp-2');

    fireEvent.click(compactFourthItem);

    expect(screen.getByText(/"id": 4/)).toBeInTheDocument();
  });

  test('Should render object value with type chip and expandable raw JSON', () => {
    const value = { nested: { ok: true }, message: 'x'.repeat(180) };
    render(<AdaptiveValueRow label="meta" value={value} />);

    expect(screen.getByText('Object')).toBeInTheDocument();

    const row = screen.getByText('meta').closest('[role="button"]');
    expect(row).toBeTruthy();
    fireEvent.click(row!);

    expect(screen.getByText(/"nested":/)).toBeInTheDocument();
    expect(screen.getByText(/"ok": true/)).toBeInTheDocument();
  });
});
