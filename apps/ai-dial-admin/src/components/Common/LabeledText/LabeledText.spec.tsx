import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LabeledText from './LabeledText';

describe('LabeledText', () => {
  it('renders label and text', () => {
    render(<LabeledText label="Test Label" text="Test Text" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Test Text')).toBeInTheDocument();
  });

  it('renders children instead of text if provided', () => {
    render(
      <LabeledText label="Child Label">
        <span>Child Content</span>
      </LabeledText>,
    );
    expect(screen.getByText('Child Content')).toBeInTheDocument();
    expect(screen.getByText('Child Label')).toBeInTheDocument();
  });

  it('renders copy button if copyButton is true', () => {
    render(<LabeledText label="Copy Label" text="Copy Text" copyButton />);
    expect(screen.getByLabelText('copy')).toBeInTheDocument();
  });

  it('renders without text', () => {
    render(<LabeledText label="No Text" />);
    expect(screen.getByText('No Text')).toBeInTheDocument();
  });
});
