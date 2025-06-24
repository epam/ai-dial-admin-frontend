import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import ErrorText from './ErrorText';

describe('Common components :: ErrorText', () => {
  test('Should render error text when provided', () => {
    render(<ErrorText errorText="This is an error" />);
    expect(screen.getByText('This is an error')).toBeInTheDocument();
  });

  test('Should render nothing when errorText is not provided', () => {
    const { container } = render(<ErrorText />);
    expect(container).toBeEmptyDOMElement();
  });
});
