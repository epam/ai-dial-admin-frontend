import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { TestSuite } from '@/src/models/evaluation/test-suite';
import ScoreSettings from '../ScoreSettings';

vi.mock('../OverallScore', () => ({ default: () => <div>overall-score</div> }));
vi.mock('../ScoreThreshold', () => ({ default: () => <div>score-threshold</div> }));

describe('ScoreSettings', () => {
  test('renders OverallScore and ScoreThreshold', () => {
    const selectedTestSuite: TestSuite = { id: 'suite-1' };

    render(<ScoreSettings selectedTestSuite={selectedTestSuite} onChange={vi.fn()} />);

    expect(screen.getByText('overall-score')).toBeInTheDocument();
    expect(screen.getByText('score-threshold')).toBeInTheDocument();
  });
});
