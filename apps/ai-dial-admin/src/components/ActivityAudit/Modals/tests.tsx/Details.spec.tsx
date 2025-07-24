import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';

import ActivityDetails from '../Details';
import { PopUpState } from '@/src/types/pop-up';

describe('Activity Details Modal', () => {
  test('Should render component', async () => {
    render(<ActivityDetails auditViewId="id" onClose={() => void 0} modalState={PopUpState.Opened} />);

    expect(screen.getByText('ActivityAudit.ActivityDetails')).toBeInTheDocument();
  });
});
