import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Search from '@/src/components/Common/Search/Search';

const ControlledSearch = ({ onChange }: { onChange: (value: string) => void }) => {
  const [pattern, setPattern] = useState('');

  return (
    <Search
      value={pattern}
      onChange={(value) => {
        setPattern(value);
        onChange(value);
      }}
    />
  );
};

describe('Search', () => {
  test('shows the provided value', () => {
    render(<Search value="abc" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('abc');
  });

  test('gives every instance a document-unique id', () => {
    render(
      <>
        <Search value="" onChange={vi.fn()} />
        <Search value="" onChange={vi.fn()} />
      </>,
    );

    const [first, second] = screen.getAllByRole('textbox');

    expect(first.id).not.toBe(second.id);
  });

  test('keeps the typed value visible and reports it through onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledSearch onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'tool');

    expect(screen.getByRole('textbox')).toHaveValue('tool');
    expect(onChange).toHaveBeenLastCalledWith('tool');
  });
});
