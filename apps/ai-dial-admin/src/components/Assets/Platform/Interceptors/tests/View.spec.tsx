import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { updateInterceptor } from '@/src/app/[lang]/platform-interceptors/actions';
import { DialInterceptorResource } from '@/src/models/dial/resource';
import InterceptorAssetView from '../View';

vi.mock('@/src/app/[lang]/platform-interceptors/actions', () => ({
  updateInterceptor: vi.fn().mockResolvedValue({ success: true }),
  removeInterceptor: vi.fn(),
  getInterceptors: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ onSave }: any) => (
    <button type="button" onClick={onSave}>
      save
    </button>
  ),
}));

vi.mock('../TabsContent', () => ({ default: () => <div>tabs-content</div> }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const interceptor = (overrides: Partial<DialInterceptorResource> = {}): DialInterceptorResource =>
  ({
    name: 'redactor',
    path: 'redactor',
    folderId: '',
    displayName: 'Redactor',
    ...overrides,
  }) as DialInterceptorResource;

const clickSave = async (entity: DialInterceptorResource) => {
  const user = userEvent.setup();
  render(<InterceptorAssetView etag="etag" originalInterceptor={entity} />);
  await user.click(screen.getByRole('button', { name: 'save' }));
};

describe('InterceptorAssetView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('Should send the interceptor to Core with its etag on save', async () => {
    await clickSave(interceptor());

    expect(updateInterceptor).toHaveBeenCalledWith(expect.objectContaining({ name: 'redactor' }), 'etag');
  });

  test('Should render the tabs content', () => {
    render(<InterceptorAssetView etag="etag" originalInterceptor={interceptor()} />);

    expect(screen.getByText('tabs-content')).toBeInTheDocument();
  });
});
