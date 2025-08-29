import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Content from './Content';

describe('Content', () => {
  it('renders children', () => {
    render(
      <Content isEnableAuth={true} beVersion={'1.0.0'}>
        <div>Test Content</div>
      </Content>,
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with beVersion', () => {
    render(
      <Content isEnableAuth={false} beVersion={'2.3.4'}>
        <span>Versioned</span>
      </Content>,
    );
    expect(screen.getByText('Versioned')).toBeInTheDocument();
  });
});
