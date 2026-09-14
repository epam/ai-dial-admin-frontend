import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import PlaceholderTokens from '@/src/components/Analytics/Common/PlaceholderTokens';
import { PlaceholderState } from '@/src/models/analytics/pipeline-ui';

describe('PlaceholderTokens', () => {
  test('renders one token per name, in the placeholder spelling', () => {
    render(
      <PlaceholderTokens
        title="Template placeholders"
        tokens={[
          { name: 'request', state: PlaceholderState.Covered },
          { name: 'response', state: PlaceholderState.Uncovered },
        ]}
      />,
    );

    expect(screen.getByText('{{request}}')).toBeTruthy();
    expect(screen.getByText('{{response}}')).toBeTruthy();
  });

  test('names the state for assistive technology rather than carrying it by colour alone', () => {
    render(
      <PlaceholderTokens
        title="Template placeholders"
        tokens={[{ name: 'request', state: PlaceholderState.Uncovered }]}
      />,
    );

    expect(screen.getByLabelText('request: AnalyticsPipelines.PlaceholderUncovered')).toBeTruthy();
  });

  test('renders nothing when there is no token to show', () => {
    const { container } = render(<PlaceholderTokens title="Template placeholders" tokens={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
