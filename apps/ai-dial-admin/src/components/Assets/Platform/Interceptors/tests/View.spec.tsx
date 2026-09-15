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

let capturedJsonConfiguration: any;
vi.mock('@/src/components/EntityHeaderControls/SimpleHeader', () => ({
  default: ({ onSave, jsonConfiguration }: any) => {
    capturedJsonConfiguration = jsonConfiguration;
    return (
      <button type="button" onClick={onSave}>
        save
      </button>
    );
  },
}));

vi.mock('../TabsContent', () => ({ default: () => <div>tabs-content</div> }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const setEntityReadOnly = vi.fn();
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ setEntityReadOnly }),
}));

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

  test('Should mark the entity read-only and hide the format selector when config-file-sourced', () => {
    const { unmount } = render(
      <InterceptorAssetView etag="etag" originalInterceptor={interceptor()} isConfigFileSource />,
    );

    expect(setEntityReadOnly).toHaveBeenCalledWith(true);
    expect(capturedJsonConfiguration?.onHideFormatSelector?.()).toBe(true);

    unmount();

    expect(setEntityReadOnly).toHaveBeenLastCalledWith(false);
  });

  test('Should not mark the entity read-only for an admin-backed interceptor', () => {
    render(<InterceptorAssetView etag="etag" originalInterceptor={interceptor()} />);

    expect(setEntityReadOnly).toHaveBeenCalledWith(false);
  });
});
