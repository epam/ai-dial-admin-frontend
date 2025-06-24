import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import Button from './Button';

describe('Common components :: Button', () => {
  test('Should render with title and be accessible by role', () => {
    render(<Button title="Click me" />);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('Should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button title="Click me" onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Click me' }));
    expect(onClick).toHaveBeenCalled();
  });

  test('Should be disabled when disable prop is true', () => {
    render(<Button title="Disabled" disable hideTitleOnMobile />);
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });

  test('Should render iconBefore and iconAfter', () => {
    render(<Button title="With Icons" iconBefore={<span>Before</span>} iconAfter={<span>After</span>} />);
    expect(screen.getByText('Before')).toBeInTheDocument();
    expect(screen.getByText('After')).toBeInTheDocument();
  });
});
