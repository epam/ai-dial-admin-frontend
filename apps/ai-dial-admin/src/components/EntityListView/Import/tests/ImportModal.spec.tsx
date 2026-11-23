import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { CLIENT_SECRET_PLACEHOLDER } from '@/src/components/EntityListView/Import/constants';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { FileImportMap } from '@/src/models/file';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import ImportModal from '../ImportModal';

vi.mock('../ImportFileType', () => ({ default: () => null }));

// The real step flow and buttons run; the grid step is replaced by a stub that exposes what the modal
// hands it and lets a test record the grid's edits and the resolution the way the real step would.
vi.mock('../ImportConflicts', () => ({
  default: ({
    withClientSecret,
    setEditedFileMap,
    setResolution,
  }: {
    withClientSecret?: boolean;
    setEditedFileMap: (map: Map<string, FileImportMap>) => void;
    setResolution: (resolution: string) => void;
  }) => (
    <div>
      <span>{`withClientSecret:${String(withClientSecret)}`}</span>
      <button onClick={() => setResolution('skip')}>choose skip</button>
      <button
        onClick={() =>
          setEditedFileMap(
            new Map([['toolsets.json', { files: [oauthToolset({ client_secret: '' }) as never], isInvalid: false }]]),
          )
        }
      >
        record cleared secret
      </button>
      <button
        onClick={() =>
          setEditedFileMap(
            new Map([
              [
                'toolsets.json',
                { files: [oauthToolset({ client_secret: 'typed-secret-123' }) as never], isInvalid: false },
              ],
            ]),
          )
        }
      >
        record typed secret
      </button>
    </div>
  ),
}));

const oauthToolset = (authSettings: Record<string, unknown> = {}) => ({
  id: 'toolsets/public/github__1.0.0',
  name: 'github',
  version: '1.0.0',
  auth_settings: { authentication_type: 'OAUTH', client_id: 'cid', client_secret_hint: 'ab12', ...authSettings },
});

const apiKeyToolset = {
  id: 'toolsets/public/plain__1.0.0',
  name: 'plain',
  version: '1.0.0',
  auth_settings: { authentication_type: 'API_KEY', api_key_header: 'Api-Key' },
};

const jsonFile = (document: unknown) =>
  new File([JSON.stringify(document)], 'toolsets.json', { type: 'application/json' });

describe('ImportModal client secrets', () => {
  const onApply = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (file: File, props: Partial<React.ComponentProps<typeof ImportModal>> = {}) =>
    render(
      <ImportModal
        isModalOpen
        route={ApplicationRoute.AssetsToolsets}
        onClose={vi.fn()}
        onApply={onApply}
        preselectedItems={[file]}
        isUnsafeImportEnabled
        {...props}
      />,
    );

  const goToFinish = async (user: ReturnType<typeof userEvent.setup>) => {
    const next = await screen.findByRole('button', { name: ButtonsI18nKey.Next });
    await waitFor(() => expect(next).toBeEnabled());
    await user.click(next);
    const finish = await screen.findByRole('button', { name: ButtonsI18nKey.Finish });
    await waitFor(() => expect(finish).toBeEnabled());
    return finish;
  };

  test('sends each OAUTH toolset with the placeholder when the grid recorded no edits', async () => {
    const user = userEvent.setup();
    renderModal(jsonFile({ toolSets: [oauthToolset(), apiKeyToolset] }));

    await user.click(await goToFinish(user));

    expect(screen.getByText('withClientSecret:true')).toBeTruthy();
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply).toHaveBeenCalledWith(
      ImportFileType.JSON,
      {
        toolSets: [
          {
            ...oauthToolset(),
            auth_settings: { authentication_type: 'OAUTH', client_id: 'cid', client_secret: CLIENT_SECRET_PLACEHOLDER },
          },
          apiKeyToolset,
        ],
      },
      ConflictResolutionPolicy.OVERRIDE,
      undefined,
      false,
    );
  });

  test('sends the secret the user typed in the grid', async () => {
    const user = userEvent.setup();
    renderModal(jsonFile({ toolSets: [oauthToolset()] }));
    const finish = await goToFinish(user);

    await user.click(screen.getByRole('button', { name: 'record typed secret' }));
    await user.click(finish);

    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply.mock.calls[0][1].toolSets[0].auth_settings).toEqual({
      authentication_type: 'OAUTH',
      client_id: 'cid',
      client_secret: 'typed-secret-123',
    });
  });

  test('omits a cleared secret under Override so the stored one is kept', async () => {
    const user = userEvent.setup();
    renderModal(jsonFile({ toolSets: [oauthToolset()] }));
    const finish = await goToFinish(user);

    await user.click(screen.getByRole('button', { name: 'record cleared secret' }));
    await user.click(finish);

    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply.mock.calls[0][1].toolSets[0].auth_settings).toEqual({
      authentication_type: 'OAUTH',
      client_id: 'cid',
    });
  });

  test('falls back to the placeholder for a cleared secret under Skip', async () => {
    const user = userEvent.setup();
    renderModal(jsonFile({ toolSets: [oauthToolset()] }));
    const finish = await goToFinish(user);

    await user.click(screen.getByRole('button', { name: 'record cleared secret' }));
    await user.click(screen.getByRole('button', { name: 'choose skip' }));
    await user.click(finish);

    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply.mock.calls[0][2]).toBe(ConflictResolutionPolicy.SKIP);
    expect(onApply.mock.calls[0][1].toolSets[0].auth_settings.client_secret).toBe(CLIENT_SECRET_PLACEHOLDER);
  });

  test('leaves the file untouched when the flag is off', async () => {
    const user = userEvent.setup();
    const document = { toolSets: [oauthToolset()] };
    renderModal(jsonFile(document), { isUnsafeImportEnabled: false });

    await user.click(await goToFinish(user));

    expect(screen.getByText('withClientSecret:false')).toBeTruthy();
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply.mock.calls[0][1]).toEqual(document);
  });

  test('leaves other routes untouched even with the flag on', async () => {
    const user = userEvent.setup();
    const document = { applications: [{ id: 'applications/public/app__1.0.0', name: 'app', version: '1.0.0' }] };
    renderModal(jsonFile(document), { route: ApplicationRoute.AssetsApplications });

    await user.click(await goToFinish(user));

    expect(screen.getByText('withClientSecret:false')).toBeTruthy();
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply.mock.calls[0][1]).toEqual(document);
  });

  test('hands an archive over as is and never enables the behavior', async () => {
    const user = userEvent.setup();
    const archive = new File(['zip'], 'toolsets.zip', { type: 'application/zip' });
    renderModal(archive);

    await user.click(await goToFinish(user));

    expect(screen.getByText('withClientSecret:false')).toBeTruthy();
    expect(onApply).toHaveBeenCalledOnce();
    expect(onApply.mock.calls[0][0]).toBe(ImportFileType.ARCHIVE);
    expect(onApply.mock.calls[0][1]).toBe(archive);
  });
});
