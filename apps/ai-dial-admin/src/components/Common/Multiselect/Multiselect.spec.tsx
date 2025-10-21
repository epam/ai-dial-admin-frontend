import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Multiselect from './Multiselect';

describe('Multiselect', () => {
  it('renders field title and error text', () => {
    render(<Multiselect elementId="id" title="Title" errorText="Error!" />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });
});
