import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Page403 from './Page403';

describe('Page403', () => {
  test('Should render forbidden page with icon and messages', () => {
    render(<Page403 />);
    expect(screen.getByText('Access Forbidden')).toBeInTheDocument();
    expect(screen.getByText('Access to this resource is denied.')).toBeInTheDocument();
    expect(screen.getByText('Refer to system administrator.')).toBeInTheDocument();
  });
});
