import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuite } from '@/src/models/evaluation/test-suite';
import ScoreSettings from '../ScoreSettings';

vi.mock('../OverallScoreCard', () => ({ default: () => <div>overall-score-card</div> }));

describe('ScoreSettings', () => {
  test('renders the Overall Score card', () => {
    const selectedTestSuite: TestSuite = { id: 'suite-1' };

    render(<ScoreSettings selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(screen.getByText('overall-score-card')).toBeInTheDocument();
  });
});
