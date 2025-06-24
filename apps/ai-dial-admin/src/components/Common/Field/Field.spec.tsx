import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Field from './Field';

describe('Common components :: Field', () => {
  test('Should render label with fieldTitle', () => {
    render(<Field fieldTitle="My Field" htmlFor="input-id" />);
    const label = screen.getByText('My Field');
    expect(label).toBeInTheDocument();
    expect(label.tagName.toLowerCase()).toBe('label');
    expect(label).toHaveAttribute('for', 'input-id');
  });

  test('Should render (Optional) when optional is true', () => {
    render(<Field fieldTitle="My Field" optional />);
    expect(screen.getByText('(Optional)')).toBeInTheDocument();
  });

  test('Should render nothing when fieldTitle is not provided', () => {
    const { container } = render(<Field />);
    expect(container).toBeEmptyDOMElement();
  });
});
