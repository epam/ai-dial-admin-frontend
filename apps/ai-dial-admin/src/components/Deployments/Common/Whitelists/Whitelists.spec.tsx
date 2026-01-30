import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { IMAGE_TEMPLATE } from '@/src/constants/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';

import Whitelists from '@/src/components/Deployments/Common/Whitelists/Whitelists';

vi.mock('@/src/app/actions/deployments.ts', () => ({
  getGlobalWhitelist: vi.fn(() =>
    Promise.resolve({
      response: ['asd.com'],
      success: true,
    }),
  ),
}));

describe('Common Whitelists component', () => {
  const setImage = vi.fn();
  const image = { ...IMAGE_TEMPLATE, allowedDomains: ['test.com'] };

  test('component rendered correctly', async () => {
    render(<Whitelists image={image} route={ApplicationRoute.Images} setImage={setImage} />);

    expect(screen.getByRole('textbox', { value: 'test.com' }));

    await waitFor(() => {
      expect(screen.getByText('asd.com')).toBeInTheDocument();
    });
  });
});
