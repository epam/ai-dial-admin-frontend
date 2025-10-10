import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Search from './Search';
import { BasicI18nKey } from '@/src/constants/i18n';

describe('Search', () => {
  it('renders with initialPattern', () => {
    render(<Search initialPattern="foo" onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText(BasicI18nKey.Search);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('foo');
  });

  it('renders with empty initialPattern', () => {
    render(<Search onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText(BasicI18nKey.Search);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('calls onChange when input changes', () => {
    const onChange = vi.fn();
    render(<Search initialPattern="bar" onChange={onChange} />);
    const input = screen.getByPlaceholderText(BasicI18nKey.Search);
    fireEvent.change(input, { target: { value: 'baz' } });
    expect(onChange).toHaveBeenCalledWith('baz');
  });
});
