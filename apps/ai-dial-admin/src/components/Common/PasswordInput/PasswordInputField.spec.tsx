import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PasswordInputField from './PasswordInputField';

describe('PasswordInputField', () => {
  it('renders the field title', () => {
    render(<PasswordInputField fieldTitle="Password" elementId="pw" />);
    expect(screen.getByText('Password')).toBeInTheDocument();
  });

  it('renders error text', () => {
    render(<PasswordInputField fieldTitle="Password" elementId="pw" errorText="Error!" />);
    expect(screen.getByText('Error!')).toBeInTheDocument();
  });

  it('renders optional label', () => {
    render(<PasswordInputField fieldTitle="Password" elementId="pw" optional />);
    expect(screen.getByText(/optional/i)).toBeInTheDocument();
  });
});
