import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import DualRunField from '../DualRunField';

describe('Compare Summary :: DualRunField', () => {
  test('renders the entries in the given order with their postfix', () => {
    render(
      <DualRunField
        label="Application"
        entries={[
          { key: 'compared', runName: 'Run #315', value: 'App B', postfix: <span>link-b</span> },
          { key: 'primary', runName: 'Run #316', value: 'App A' },
        ]}
      />,
    );

    const text = document.body.textContent ?? '';
    expect(screen.getByText('Application')).toBeInTheDocument();
    expect(text.indexOf('Run #315')).toBeLessThan(text.indexOf('Run #316'));
    expect(screen.getByText('link-b')).toBeInTheDocument();
  });
});
