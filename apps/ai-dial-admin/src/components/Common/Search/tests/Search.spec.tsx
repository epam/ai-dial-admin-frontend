import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Search from '@/src/components/Common/Search/Search';

const ControlledSearch = ({ onChange }: { onChange: (value: string) => void }) => {
  const [pattern, setPattern] = useState('');

  return (
    <Search
      initialPattern={pattern}
      onChange={(value) => {
        setPattern(value);
        onChange(value);
      }}
    />
  );
};

describe('Search', () => {
  test('shows the provided initial pattern', () => {
    render(<Search initialPattern="abc" onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('abc');
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
