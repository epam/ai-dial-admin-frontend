import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getGlobalWhitelist } from '@/src/app/actions/deployments';
import Whitelists from '@/src/components/Deployments/Common/Whitelists/Whitelists';
import { IMAGE_TEMPLATE } from '@/src/constants/deployments/images';
import { Image } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/app/actions/deployments', () => ({ getGlobalWhitelist: vi.fn() }));

describe('Common Whitelists component', () => {
  const setImage = vi.fn();
  const image = { ...IMAGE_TEMPLATE, allowedDomains: ['test.com'] };

  beforeEach(() => {
    vi.clearAllMocks();
    // Armed per test, not in the mock factory: clearing or resetting mocks drops an implementation set at module
    // scope, and `getGlobalWhitelist().then(...)` in the component's effect then throws on `undefined`.
    vi.mocked(getGlobalWhitelist).mockResolvedValue({ response: ['asd.com'], success: true });
  });

  test('component rendered correctly', async () => {
    render(<Whitelists entity={image as Image} route={ApplicationRoute.Images} setEntity={setImage} />);

    expect(screen.getByRole('textbox')).toHaveValue('test.com');

    expect(await screen.findByText('asd.com')).toBeInTheDocument();
    expect(getGlobalWhitelist).toHaveBeenCalledOnce();
  });
});
