import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import SummarySection from '@/src/components/Runs/Summary/SummarySection';

describe('SummarySection', () => {
  test('renders the title as a heading with its content', () => {
    render(
      <SummarySection title="Section title">
        <p>content</p>
      </SummarySection>,
    );

    expect(screen.getByRole('heading', { name: 'Section title' })).toBeTruthy();
    expect(screen.getByText('content')).toBeTruthy();
  });

  test('puts the title suffix beside the heading without making it part of the heading name', () => {
    render(
      <SummarySection title="Section title" titleSuffix={<button type="button">Info</button>}>
        <p>content</p>
      </SummarySection>,
    );

    expect(screen.getByRole('heading', { name: 'Section title' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Info' })).toBeTruthy();
  });
});
