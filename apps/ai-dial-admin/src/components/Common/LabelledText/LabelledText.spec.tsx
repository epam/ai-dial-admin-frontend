import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LabelledText from './LabelledText';

describe('LabelledText', () => {
  it('renders label and text', () => {
    render(<LabelledText label="Test Label" text="Test Text" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Test Text')).toBeInTheDocument();
  });

  it('renders children instead of text if provided', () => {
    render(
      <LabelledText label="Child Label">
        <span>Child Content</span>
      </LabelledText>,
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
    expect(screen.getByText('Child Label')).toBeInTheDocument();
  });

  it('renders copy button if copyButton is true', () => {
    render(<LabelledText label="Copy Label" text="Copy Text" copyable />);
    expect(screen.getByLabelText('copy')).toBeInTheDocument();
  });

  it('renders without text', () => {
    render(<LabelledText label="No Text" />);
    expect(screen.getByText('No Text')).toBeInTheDocument();
  });
});
