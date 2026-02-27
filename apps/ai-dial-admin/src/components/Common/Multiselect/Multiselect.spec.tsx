import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import Multiselect from './Multiselect';

describe('Multiselect', () => {
  test('renders field title and error text', () => {
    render(<Multiselect elementId="id" label="Title" errorText="Error!" />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });
});
