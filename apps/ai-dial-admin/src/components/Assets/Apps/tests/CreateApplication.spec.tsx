import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { checkIsUniqueDeploymentName } from '@/src/app/actions';
import { ButtonsI18nKey, EntityFieldsI18nKey, InterfacesI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import CreateApplication from '../CreateApplication';

const mockSourceField = vi.fn();

vi.mock('@/src/app/actions', () => ({ checkIsUniqueDeploymentName: vi.fn().mockResolvedValue(true) }));
vi.mock('@/src/components/BaseControls/Id/Id', () => ({
  default: ({
    entity,
    onChangeEntity,
  }: {
    entity: { name?: string; interfaces?: Record<string, unknown> };
    onChangeEntity: (entity: { name: string; interfaces?: Record<string, unknown> }) => void;
  }) => createElement('button', { onClick: () => onChangeEntity({ ...entity, name: 'app' }) }, 'set id'),
}));
vi.mock('@/src/components/BaseControls/DisplayName', () => ({
  default: ({ onChange }: { onChange: (value: string) => void }) =>
    createElement('button', { onClick: () => onChange('Application') }, 'set display name'),
}));
vi.mock('@/src/components/BaseControls/Version', () => ({
  default: () => createElement('div', null, EntityFieldsI18nKey.version),
}));
vi.mock('@/src/components/BaseControls/Description', () => ({
  default: () => createElement('div', null, EntityFieldsI18nKey.description),
}));
vi.mock('@/src/components/Assets/Resources/ResourceSourceField', () => ({
  default: (props: {
    entity: { interfaces?: Record<string, unknown> };
    onChange: (entity: { interfaces?: Record<string, unknown> }) => void;
  }) => {
    mockSourceField(props);
    return createElement(
      'div',
      null,
      'resource-source-field',
      createElement(
        'button',
        {
          onClick: () =>
            props.onChange({
              ...props.entity,
              interfaces: { 'test-interface': { base_url: 'https://example.com' } },
            }),
        },
        'configure interfaces',
      ),
    );
  },
}));

interface RenderOptions {
  filePath?: string;
  onCreate?: ReturnType<typeof vi.fn>;
  onClose?: ReturnType<typeof vi.fn>;
}

const renderCreateApplication = ({
  filePath = 'public/',
  onCreate = vi.fn(),
  onClose = vi.fn(),
}: RenderOptions = {}) => {
  render(
    createElement(CreateApplication, {
      isOpen: true,
      names: [],
      getContext: () => ({ filePath, fetchFiles: vi.fn() }) as never,
      onClose: onClose as never,
      onCreate: onCreate as never,
    }),
  );

  return { onCreate, onClose };
};

const advanceToSource = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'set id' }));
  await user.click(screen.getByRole('button', { name: 'set display name' }));
  await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Next }));
  await waitFor(() => expect(screen.getByText('resource-source-field')).toBeInTheDocument());
  return user;
};

const configureInterfaces = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'configure interfaces' }));
  await waitFor(() => expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeEnabled());
};


describe('CreateApplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkIsUniqueDeploymentName).mockResolvedValue(true);
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as never);
  });

  test('shows identity fields before source configuration', () => {
    renderCreateApplication();

    expect(screen.getByText(EntityFieldsI18nKey.version)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.description)).toBeInTheDocument();
    expect(screen.queryByText('resource-source-field')).toBeNull();
  });

  test('omits version for a platform destination', () => {
    renderCreateApplication({ filePath: 'platform/' });

    expect(screen.queryByText(EntityFieldsI18nKey.version)).toBeNull();
  });

  test('opens the bounded source step with Interfaces selected by default', async () => {
    renderCreateApplication();
    await advanceToSource();

    expect(mockSourceField).toHaveBeenCalledWith(
      expect.objectContaining({
        initialSource: 'interfaces',
        sourceItems: expect.arrayContaining([expect.objectContaining({ label: InterfacesI18nKey.Interfaces })]),
        view: ApplicationRoute.AssetsApplications,
      }),
    );
    expect(screen.getByText('resource-source-field').closest('[role="dialog"]')).toHaveClass('max-h-[750px]');
  });

  test('disables creation until an Interfaces source is configured', async () => {
    renderCreateApplication();
    const user = await advanceToSource();

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeDisabled();

    await configureInterfaces(user);
  });

  test('keeps the creation modal open after a failed submit', async () => {
    const onCreate = vi.fn().mockResolvedValue({ success: false, status: 400 });
    renderCreateApplication({ onCreate });
    const user = await advanceToSource();
    await configureInterfaces(user);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
    expect(screen.getByText('resource-source-field')).toBeInTheDocument();
  });

  test('submits the Interfaces draft without a source discriminator', async () => {
    const onCreate = vi.fn().mockResolvedValue({ success: true });
    const onClose = vi.fn();
    renderCreateApplication({ onCreate, onClose });
    const user = await advanceToSource();
    await configureInterfaces(user);

    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Create }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledOnce());
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        folderId: 'public/',
        interfaces: { 'test-interface': { base_url: 'https://example.com' } },
        name: 'app',
      }),
      undefined,
      undefined,
      false,
    );
    expect(onCreate).toHaveBeenCalledWith(
      expect.not.objectContaining({ source: expect.anything() }),
      undefined,
      undefined,
      false,
    );
    expect(onClose).toHaveBeenCalledOnce();
  });
});
