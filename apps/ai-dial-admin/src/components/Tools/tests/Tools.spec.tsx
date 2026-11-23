import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as applicationActions from '@/src/app/[lang]/applications/actions';
import * as assetApplicationActions from '@/src/app/[lang]/assets-applications/actions';
import * as toolsetActions from '@/src/app/[lang]/toolsets/actions';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import Tools from '@/src/components/Tools/Tools';
import { ButtonsI18nKey, EntitiesI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import * as AppContext from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { DialApplication } from '@/src/models/dial/application';
import { ApplicationRoute } from '@/src/types/routes';

const runnerApplication: DialApplication = {
  name: 'assistant',
  source: { $type: SOURCE_TYPE.SCHEMA, applicationTypeSchemaId: 'runner' },
  applicationProperties: { region: 'west' },
};
const toolsResponse = { success: true, response: { tools: [{ name: 'weather' }, { name: 'clock' }] } };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(AppContext, 'useAppContext').mockReturnValue({
    sidebar: {
      show: false,
      content: null,
      showSidebar: vi.fn(),
      closeSidebar: vi.fn(),
      toggleIsMenuClosed: vi.fn(),
      isMenuClosed: false,
    },
    toggleSidebar: vi.fn(),
  } as any);
});

afterEach(() => vi.useRealTimers());

describe('Tools', () => {
  test('renders with no containerId', () => {
    render(<Tools />);
    expect(screen.getByText(EntitiesI18nKey.NoTools)).toBeInTheDocument();
  });

  test('keeps the typed search value visible in the search field', async () => {
    const user = userEvent.setup();
    render(<Tools />);
    await user.type(screen.getByRole('textbox'), 'weather');
    expect(screen.getByRole('textbox')).toHaveValue('weather');
  });

  test('shows effective runner tools without management or application changes', async () => {
    const getAllowedTools = vi.spyOn(applicationActions, 'getAllowedTools').mockResolvedValue(toolsResponse);
    const onChangeEntity = vi.fn();
    const user = userEvent.setup();
    render(
      <Tools
        view={ApplicationRoute.Applications}
        isRunnerApplication
        originalEntity={runnerApplication}
        selectedEntity={runnerApplication}
        onChangeEntity={onChangeEntity}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'weather' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'clock' })).toBeInTheDocument();
    expect(getAllowedTools).toHaveBeenCalledWith('assistant');
    expect(screen.queryByText(ToolsetI18nKey.UseAllTools)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.ManageTool })).not.toBeInTheDocument();
    expect(screen.queryByText(ToolsetI18nKey.Warning)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: ButtonsI18nKey.TryOut })).toHaveLength(2);

    await user.type(screen.getByRole('textbox'), 'weather');
    expect(await screen.findByRole('heading', { name: `${ToolsetI18nKey.Tools}: 1` })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'clock' })).not.toBeInTheDocument();
    await user.clear(screen.getByRole('textbox'));
    expect(await screen.findByRole('heading', { name: 'clock' })).toBeInTheDocument();
    expect(onChangeEntity).not.toHaveBeenCalled();
  });

  test('debounces runner tool searches until typing stops', async () => {
    vi.useFakeTimers();
    vi.spyOn(applicationActions, 'getAllowedTools').mockResolvedValue(toolsResponse);
    render(
      <Tools
        view={ApplicationRoute.Applications}
        isRunnerApplication
        originalEntity={runnerApplication}
        selectedEntity={runnerApplication}
      />,
    );
    await act(async () => {});
    expect(screen.getByRole('heading', { name: 'clock' })).toBeInTheDocument();

    const clock = screen.getByRole('heading', { name: 'clock' });
    const input = screen.getByRole('textbox');
    input.focus();
    fireEvent.change(input, { target: { value: 'wea' } });
    expect(screen.getByRole('status')).toHaveTextContent(ToolsetI18nKey.SearchingTools);
    expect(screen.getByRole('region', { name: ToolsetI18nKey.Tools })).toHaveAttribute('aria-busy', 'true');
    expect(input).toHaveFocus();
    expect(clock).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTimeAsync(200));
    fireEvent.change(input, { target: { value: 'weather' } });
    await act(async () => vi.advanceTimersByTimeAsync(299));
    expect(screen.getByRole('status')).toHaveTextContent(ToolsetI18nKey.SearchingTools);
    expect(clock).toBeInTheDocument();

    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('region', { name: ToolsetI18nKey.Tools })).toHaveAttribute('aria-busy', 'false');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('heading', { name: 'clock' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'weather' })).toBeInTheDocument();
  });

  test('cancels a pending search and preserves existing tool rows', async () => {
    vi.useFakeTimers();
    vi.spyOn(applicationActions, 'getAllowedTools').mockResolvedValue(toolsResponse);
    render(
      <Tools
        view={ApplicationRoute.Applications}
        isRunnerApplication
        originalEntity={runnerApplication}
        selectedEntity={runnerApplication}
      />,
    );
    await act(async () => {});
    const weather = screen.getByRole('heading', { name: 'weather' });
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: 'wea' } });
    expect(screen.getByRole('status')).toHaveTextContent(ToolsetI18nKey.SearchingTools);
    expect(weather).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('heading', { name: 'weather' })).toBe(weather);
    await act(async () => vi.advanceTimersByTimeAsync(300));
    expect(screen.getByRole('heading', { name: 'clock' })).toBeInTheDocument();
  });

  test('shows the empty state only after a pending search settles', async () => {
    vi.useFakeTimers();
    vi.spyOn(applicationActions, 'getAllowedTools').mockResolvedValue(toolsResponse);
    render(
      <Tools
        view={ApplicationRoute.Applications}
        isRunnerApplication
        originalEntity={runnerApplication}
        selectedEntity={runnerApplication}
      />,
    );
    await act(async () => {});
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'missing' } });
    expect(screen.getByRole('status')).toHaveTextContent(ToolsetI18nKey.SearchingTools);
    expect(screen.queryByText(EntitiesI18nKey.NoTools)).not.toBeInTheDocument();
    await act(async () => vi.advanceTimersByTimeAsync(300));
    expect(screen.getByText(EntitiesI18nKey.NoTools)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByRole('status')).toHaveTextContent(ToolsetI18nKey.SearchingTools);
    await act(async () => vi.advanceTimersByTimeAsync(300));
    expect(screen.getByRole('heading', { name: 'clock' })).toBeInTheDocument();
  });

  test('uses the saved asset path and warns when application properties have changed', async () => {
    const getAssetAllowedTools = vi
      .spyOn(assetApplicationActions, 'getAssetAllowedTools')
      .mockResolvedValue(toolsResponse);
    const saved = { ...runnerApplication, _metadata: { path: 'public/team/assistant__1' } };
    const selected = { ...saved, applicationProperties: { region: 'east' } };
    render(
      <Tools
        view={ApplicationRoute.AssetsApplications}
        isAsset
        isRunnerApplication
        originalEntity={saved}
        selectedEntity={selected}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'weather' })).toBeInTheDocument();
    expect(getAssetAllowedTools).toHaveBeenCalledWith('public/team/assistant__1');
    expect(screen.getByText(ToolsetI18nKey.SavedApplicationToolsWarning)).toBeInTheDocument();
  });

  test('shows loaded runner tools immediately without an intermediate empty state', async () => {
    vi.useFakeTimers();
    vi.spyOn(applicationActions, 'getAllowedTools').mockResolvedValue(toolsResponse);
    render(
      <Tools
        view={ApplicationRoute.Applications}
        isRunnerApplication
        originalEntity={runnerApplication}
        selectedEntity={runnerApplication}
      />,
    );

    expect(screen.queryByText(EntitiesI18nKey.NoTools)).not.toBeInTheDocument();
    await act(async () => {});
    expect(screen.getByRole('heading', { name: 'weather' })).toBeInTheDocument();
    expect(screen.queryByText(EntitiesI18nKey.NoTools)).not.toBeInTheDocument();
  });

  test('shows the loading state while effective tool discovery is pending', () => {
    vi.spyOn(applicationActions, 'getAllowedTools').mockReturnValue(new Promise(() => {}));
    render(
      <Tools
        view={ApplicationRoute.Applications}
        isRunnerApplication
        originalEntity={runnerApplication}
        selectedEntity={runnerApplication}
      />,
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText(ToolsetI18nKey.UseAllTools)).not.toBeInTheDocument();
  });

  test('shows an empty state when the effective tools response is empty', async () => {
    vi.spyOn(applicationActions, 'getAllowedTools').mockResolvedValue({ success: true, response: { tools: [] } });
    render(
      <Tools
        view={ApplicationRoute.Applications}
        isRunnerApplication
        originalEntity={runnerApplication}
        selectedEntity={runnerApplication}
      />,
    );
    expect(await screen.findByText(EntitiesI18nKey.NoTools)).toBeInTheDocument();
    expect(screen.queryByText(ToolsetI18nKey.UseAllTools)).not.toBeInTheDocument();
  });

  test('notifies on effective discovery failure without showing an unfiltered fallback', async () => {
    const getTools = vi.spyOn(applicationActions, 'getTools');
    vi.spyOn(applicationActions, 'getAllowedTools').mockResolvedValue({ success: false, errorMessage: 'failure' });
    render(
      <Tools
        view={ApplicationRoute.Applications}
        isRunnerApplication
        originalEntity={runnerApplication}
        selectedEntity={runnerApplication}
      />,
    );
    expect(await screen.findByText(EntitiesI18nKey.NoTools)).toBeInTheDocument();
    expect(useNotification().showNotification).toHaveBeenCalledOnce();
    expect(getTools).not.toHaveBeenCalled();
  });

  test('keeps Try Out unavailable to a read-only administrator', async () => {
    vi.spyOn(applicationActions, 'getAllowedTools').mockResolvedValue(toolsResponse);
    render(
      <Tools
        view={ApplicationRoute.Applications}
        isRunnerApplication
        disabled
        originalEntity={runnerApplication}
        selectedEntity={runnerApplication}
      />,
    );
    expect(await screen.findByRole('heading', { name: 'weather' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.TryOut })).not.toBeInTheDocument();
  });

  test('retains toolset management controls and discovery', async () => {
    const user = userEvent.setup();
    const getTools = vi.spyOn(toolsetActions, 'getTools').mockResolvedValue(toolsResponse);
    const onChangeEntity = vi.fn();
    const toolset = { name: 'my-toolset', allowedTools: ['weather'] };
    render(
      <Tools
        view={ApplicationRoute.Toolsets}
        originalEntity={toolset}
        selectedEntity={toolset}
        onChangeEntity={onChangeEntity}
      />,
    );
    expect(await screen.findByRole('heading', { name: 'weather' })).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.UseAllTools)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.ManageTool })).toBeInTheDocument();
    expect(getTools).toHaveBeenCalledWith('my-toolset');
    await user.click(screen.getByRole('switch', { name: ToolsetI18nKey.UseAllTools }));
    expect(onChangeEntity).toHaveBeenCalledWith({ ...toolset, allowedTools: [] });
  });

  test('retains management for a direct MCP application', async () => {
    vi.spyOn(applicationActions, 'getTools').mockResolvedValue(toolsResponse);
    const application = { name: 'direct', mcp: { endpoint: 'https://example.test/mcp', allowedTools: ['weather'] } };
    render(<Tools view={ApplicationRoute.Applications} originalEntity={application} selectedEntity={application} />);
    expect(await screen.findByRole('heading', { name: 'weather' })).toBeInTheDocument();
    expect(screen.getByText(ToolsetI18nKey.UseAllTools)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.ManageTool })).toBeInTheDocument();
  });
});
