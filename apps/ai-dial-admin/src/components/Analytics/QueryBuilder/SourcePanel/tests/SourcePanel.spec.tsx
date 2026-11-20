import { navigationMock } from '@/test-mocks/navigation';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getEntitySchema } from '@/src/app/[lang]/queries/actions';
import QueryPageShell from '@/src/components/Analytics/QueryBuilder/SourcePanel/QueryPageShell';
import {
  SourcePanelProvider,
  useSourcePanel,
  useSourcePanelUnsavedWork,
} from '@/src/components/Analytics/QueryBuilder/SourcePanel/context';
import { SourceTable } from '@/src/components/Analytics/QueryBuilder/SourcePanel/models';
import { AnalyticsEntityField, AnalyticsFieldType } from '@/src/models/analytics/entity';
import { SavedQuery, SavedQueryScope } from '@/src/models/analytics/saved-query';

vi.mock('@/src/app/[lang]/queries/actions');

const { showNotification } = vi.hoisted(() => ({ showNotification: vi.fn() }));
vi.mock('@/src/context/NotificationContext', () => ({
  useNotification: () => ({ showNotification, removeNotification: vi.fn() }),
}));

const { push: mockPush } = navigationMock.router;
const TABLES: SourceTable[] = [
  { name: 'conversation', description: 'One row per conversation', tagOrder: ['principal', 'identity'] },
  { name: 'dial_usage_log' },
];

const FIELDS: AnalyticsEntityField[] = [
  { name: 'chat_id', type: AnalyticsFieldType.String, source: 'chat_id', tag: 'identity' },
  {
    name: 'trace_ids',
    type: AnalyticsFieldType.Array,
    source: 'trace_ids',
    tag: 'identity',
    display_name: 'Trace IDs',
    description: 'Trace ids of the turns',
  },
  { name: 'user_hash', type: AnalyticsFieldType.String, source: 'user_hash', tag: 'principal', sensitive: true },
  { name: 'pipeline_generation', type: AnalyticsFieldType.Long, source: 'pipeline_generation' },
];

const savedQuery = (overrides: Partial<SavedQuery>): SavedQuery => ({
  id: 'sq_1',
  name: 'insights',
  scope: SavedQueryScope.Common,
  generation: 1,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
  ...overrides,
});

const QUERIES: SavedQuery[] = [
  savedQuery({ id: 'sq_1', name: 'insights', description: 'Explore conversation activity' }),
  savedQuery({ id: 'sq_2', name: 'Cost concentration', scope: SavedQueryScope.Personal, tag: 'finance' }),
];

interface PanelProps {
  tables?: SourceTable[];
  queries?: SavedQuery[];
  currentTable?: string;
  currentQueryId?: string;
  hasUnsavedWork?: boolean;
  onDiscard?: () => void;
}

const UnsavedWork: FC<Pick<PanelProps, 'hasUnsavedWork' | 'onDiscard'>> = ({ hasUnsavedWork = false, onDiscard }) => {
  const { draftTable } = useSourcePanel();
  useSourcePanelUnsavedWork(hasUnsavedWork, onDiscard);
  return <div>builder on {draftTable ?? 'the default table'}</div>;
};

const renderPanel = ({
  tables = TABLES,
  queries = QUERIES,
  currentTable,
  currentQueryId,
  hasUnsavedWork,
  onDiscard,
}: PanelProps = {}) =>
  render(
    <SourcePanelProvider tables={tables} queries={queries}>
      <QueryPageShell currentTable={currentTable} currentQueryId={currentQueryId}>
        <UnsavedWork hasUnsavedWork={hasUnsavedWork} onDiscard={onDiscard} />
      </QueryPageShell>
    </SourcePanelProvider>,
  );

const tab = (name: string) => screen.getByRole('tab', { name });
const toggles = () => screen.getAllByRole('button', { name: 'QuerySourcePanel.TableColumns' });

describe('SourcePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(getEntitySchema).mockResolvedValue({ success: true, response: { fields: FIELDS } });
  });

  describe('tabs', () => {
    test('opens on the Tables tab for a draft and marks its table', () => {
      renderPanel({ currentTable: 'conversation' });

      expect(tab('QuerySourcePanel.Tables')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('link', { name: 'conversation' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'dial_usage_log' })).not.toHaveAttribute('aria-current');
    });

    test('opens on the Queries tab for a saved query and marks it', () => {
      renderPanel({ currentQueryId: 'sq_1' });

      expect(tab('QuerySourcePanel.Queries')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('link', { name: 'insights' })).toHaveAttribute('aria-current', 'page');
    });

    test('keeps the first tab when the page changes without the user picking one', () => {
      const renderShell = (currentQueryId?: string) => (
        <SourcePanelProvider tables={TABLES} queries={QUERIES}>
          <QueryPageShell key={currentQueryId ?? 'draft'} currentQueryId={currentQueryId}>
            <div>builder</div>
          </QueryPageShell>
        </SourcePanelProvider>
      );
      const { rerender } = render(renderShell());
      expect(tab('QuerySourcePanel.Tables')).toHaveAttribute('aria-selected', 'true');

      rerender(renderShell('sq_1'));

      expect(tab('QuerySourcePanel.Tables')).toHaveAttribute('aria-selected', 'true');
    });

    test('switches tabs without navigating and keeps each search text', async () => {
      const user = userEvent.setup();
      renderPanel({ currentTable: 'conversation' });

      fireEvent.change(screen.getByRole('textbox', { name: 'QuerySourcePanel.SearchTables' }), {
        target: { value: 'usage' },
      });
      await user.click(tab('QuerySourcePanel.Queries'));
      expect(screen.getByRole('textbox', { name: 'QuerySourcePanel.SearchQueries' })).toHaveValue('');

      await user.click(tab('QuerySourcePanel.Tables'));

      expect(screen.getByRole('textbox', { name: 'QuerySourcePanel.SearchTables' })).toHaveValue('usage');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('collapsing', () => {
    test('collapses to a strip and remembers it', async () => {
      const user = userEvent.setup();
      const { unmount } = renderPanel();

      await user.click(screen.getByRole('button', { name: 'QuerySourcePanel.Collapse' }));

      expect(screen.queryByRole('tab', { name: 'QuerySourcePanel.Tables' })).toBeNull();
      expect(screen.getByRole('button', { name: 'QuerySourcePanel.Expand' })).toHaveAttribute('aria-expanded', 'false');

      unmount();
      renderPanel();

      expect(await screen.findByRole('button', { name: 'QuerySourcePanel.Expand' })).toBeInTheDocument();
    });

    test('expands again from the strip', async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(screen.getByRole('button', { name: 'QuerySourcePanel.Collapse' }));

      await user.click(screen.getByRole('button', { name: 'QuerySourcePanel.Expand' }));

      expect(tab('QuerySourcePanel.Tables')).toBeInTheDocument();
    });
  });

  describe('Tables tab', () => {
    test('links each table to the draft builder', () => {
      renderPanel();

      expect(screen.getByRole('link', { name: 'conversation' })).toHaveAttribute('href', '/en/queries');
    });

    test('makes the picked table the table of the draft', async () => {
      const user = userEvent.setup();
      renderPanel();
      expect(screen.getByText('builder on the default table')).toBeInTheDocument();

      await user.click(screen.getByRole('link', { name: 'dial_usage_log' }));

      expect(await screen.findByText('builder on dial_usage_log')).toBeInTheDocument();
    });

    test('narrows the list by table name', () => {
      renderPanel();

      fireEvent.change(screen.getByRole('textbox', { name: 'QuerySourcePanel.SearchTables' }), {
        target: { value: 'USAGE' },
      });

      expect(screen.getByRole('link', { name: 'dial_usage_log' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'conversation' })).toBeNull();
    });

    test('shows a no-results state when the search matches nothing', () => {
      renderPanel();

      fireEvent.change(screen.getByRole('textbox', { name: 'QuerySourcePanel.SearchTables' }), {
        target: { value: 'sessions' },
      });

      expect(screen.getByText('Entities.NoResults')).toBeInTheDocument();
    });

    test('shows an empty state when there are no tables', () => {
      renderPanel({ tables: [] });

      expect(screen.getByText('QuerySourcePanel.NoTables')).toBeInTheDocument();
    });

    test('loads columns on first expansion only, grouped in the table tag order', async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(toggles()[0]);

      expect(await screen.findByText('chat_id')).toBeInTheDocument();
      expect(getEntitySchema).toHaveBeenCalledExactlyOnceWith('conversation');
      const groups = screen.getAllByRole('button', { expanded: true }).filter((button) => button !== toggles()[0]);
      expect(groups.map((group) => group.textContent)).toEqual(expect.arrayContaining(['principal1', 'identity2']));
      expect(groups[1].textContent).toBe('principal1');

      await user.click(toggles()[0]);
      await user.click(toggles()[0]);

      expect(await screen.findByText('chat_id')).toBeInTheDocument();
      expect(getEntitySchema).toHaveBeenCalledOnce();
    });

    test('does not pick the table when it is expanded', async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(toggles()[1]);

      expect(await screen.findByText('chat_id')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('shows a display name with its type and lists untagged columns outside the groups', async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(toggles()[0]);

      expect(await screen.findByText('Trace IDs')).toBeInTheDocument();
      expect(screen.queryByText('trace_ids')).toBeNull();
      expect(screen.getByText(AnalyticsFieldType.Array)).toBeInTheDocument();
      expect(screen.getByText('pipeline_generation')).toBeInTheDocument();
    });

    test('describes a column in its tooltip without repeating a label that fits', async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(toggles()[0]);

      await user.hover(await screen.findByText('Trace IDs'));

      expect(await screen.findByText('Trace ids of the turns')).toBeInTheDocument();
      expect(screen.queryByText('QuerySourcePanel.ColumnName')).toBeNull();
    });

    test('gives the full label in the tooltip when it is truncated', async () => {
      const user = userEvent.setup();
      const scrollWidth = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(300);
      const clientWidth = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(120);
      renderPanel();
      await user.click(toggles()[0]);

      await user.hover(await screen.findByText('pipeline_generation'));

      expect(await screen.findByText('QuerySourcePanel.ColumnName')).toBeInTheDocument();
      scrollWidth.mockRestore();
      clientWidth.mockRestore();
    });

    test('states in text that a sensitive column holds sensitive data', async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(toggles()[0]);

      await user.hover(await screen.findByText('user_hash'));

      expect(await screen.findByText('QuerySourcePanel.SensitiveData')).toBeInTheDocument();
    });

    test('shows a table description on hover', async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.hover(screen.getByRole('link', { name: 'conversation' }));

      expect(await screen.findByText('One row per conversation')).toBeInTheDocument();
    });

    test('collapses one tag group on its own', async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(toggles()[0]);
      await screen.findByText('chat_id');

      await user.click(screen.getByRole('button', { name: /identity/ }));

      expect(screen.queryByText('chat_id')).toBeNull();
      expect(screen.getByText('user_hash')).toBeInTheDocument();
    });

    test('reports a failed column read under the table and retries it', async () => {
      const user = userEvent.setup();
      vi.mocked(getEntitySchema).mockResolvedValueOnce({ success: false });
      renderPanel();

      await user.click(toggles()[0]);
      expect(await screen.findByText('QuerySourcePanel.ColumnsLoadFailed')).toBeInTheDocument();
      expect(screen.getByText(/^builder/)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'QuerySourcePanel.Retry' }));

      expect(await screen.findByText('chat_id')).toBeInTheDocument();
    });

    test('treats a thrown column read as a failure', async () => {
      const user = userEvent.setup();
      vi.mocked(getEntitySchema).mockRejectedValueOnce(new Error('network down'));
      renderPanel();

      await user.click(toggles()[0]);

      expect(await screen.findByText('QuerySourcePanel.ColumnsLoadFailed')).toBeInTheDocument();
    });
  });

  describe('Queries tab', () => {
    test('lists both scopes ordered by name and links each to its page', () => {
      renderPanel({ currentQueryId: 'sq_1' });

      const links = screen.getAllByRole('link');
      expect(links.map((link) => link.textContent)).toEqual(['Cost concentration', 'insights']);
      expect(links[1]).toHaveAttribute('href', '/en/queries/sq_1');
    });

    test('matches the search against name and tag', () => {
      renderPanel({ currentQueryId: 'sq_1' });

      fireEvent.change(screen.getByRole('textbox', { name: 'QuerySourcePanel.SearchQueries' }), {
        target: { value: 'finance' },
      });

      expect(screen.getByRole('link', { name: 'Cost concentration' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'insights' })).toBeNull();
    });

    test('narrows to a scope and says so on the filter control', async () => {
      const user = userEvent.setup();
      renderPanel({ currentQueryId: 'sq_1' });

      await user.click(screen.getByRole('button', { name: 'QuerySourcePanel.ScopeFilter' }));
      const personal = await screen.findByRole('menuitemradio', { name: 'Queries.ScopePersonal' });
      expect(personal).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('menuitemradio', { name: 'QuerySourcePanel.ScopeAll' })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      await user.click(personal);

      expect(await screen.findByRole('button', { name: 'QuerySourcePanel.ScopeFilterActive' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Cost concentration' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'insights' })).toBeNull();
    });

    test('shows a no-results state when the filters leave nothing', () => {
      renderPanel({ currentQueryId: 'sq_1' });

      fireEvent.change(screen.getByRole('textbox', { name: 'QuerySourcePanel.SearchQueries' }), {
        target: { value: 'nothing' },
      });

      expect(screen.getByText('Entities.NoResults')).toBeInTheDocument();
    });

    test('shows an empty state when nothing is saved', () => {
      renderPanel({ queries: [], currentQueryId: 'sq_1' });

      expect(screen.getByText('Entities.NoQueries')).toBeInTheDocument();
    });
  });

  describe('Queries tab — tag groups', () => {
    const TAGGED: SavedQuery[] = [
      savedQuery({ id: 'q_1', name: 'aardvark' }),
      savedQuery({ id: 'q_2', name: 'Revenue', tag: 'Beta', scope: SavedQueryScope.Personal }),
      savedQuery({ id: 'q_3', name: 'weekly users', tag: 'alpha' }),
      savedQuery({ id: 'q_4', name: 'Daily users', tag: 'alpha' }),
      savedQuery({ id: 'q_5', name: 'blank tagged', tag: '  ' }),
    ];

    const groupHeaders = () => screen.getAllByRole('button', { name: 'QuerySourcePanel.QueryTag' });
    const linkNames = () => screen.getAllByRole('link').map((link) => link.textContent);

    test('lists a group per tag ordered by tag name ignoring case, each with its tag and query count', () => {
      renderPanel({ queries: TAGGED, currentQueryId: 'q_1' });

      expect(groupHeaders().map((header) => header.textContent)).toEqual(['alpha2', 'Beta1']);
    });

    test('keeps the name order inside a group and lists untagged queries after every group', () => {
      renderPanel({ queries: TAGGED, currentQueryId: 'q_1' });

      expect(linkNames()).toEqual(['Daily users', 'weekly users', 'Revenue', 'aardvark', 'blank tagged']);
    });

    test('marks the current query inside its group', () => {
      renderPanel({ queries: TAGGED, currentQueryId: 'q_4' });

      expect(screen.getByRole('link', { name: 'Daily users' })).toHaveAttribute('aria-current', 'page');
      expect(screen.getByRole('link', { name: 'weekly users' })).not.toHaveAttribute('aria-current');
    });

    test('starts every group expanded', () => {
      renderPanel({ queries: TAGGED, currentQueryId: 'q_1' });

      groupHeaders().forEach((header) => expect(header).toHaveAttribute('aria-expanded', 'true'));
    });

    test('collapses one group on its own and expands it again', async () => {
      const user = userEvent.setup();
      renderPanel({ queries: TAGGED, currentQueryId: 'q_1' });

      await user.click(groupHeaders()[0]);

      expect(groupHeaders()[0]).toHaveAttribute('aria-expanded', 'false');
      expect(groupHeaders()[1]).toHaveAttribute('aria-expanded', 'true');
      expect(linkNames()).toEqual(['Revenue', 'aardvark', 'blank tagged']);

      await user.click(groupHeaders()[0]);

      expect(groupHeaders()[0]).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('link', { name: 'Daily users' })).toBeInTheDocument();
    });

    test('drops a group whose queries the search filters out', () => {
      renderPanel({ queries: TAGGED, currentQueryId: 'q_1' });

      fireEvent.change(screen.getByRole('textbox', { name: 'QuerySourcePanel.SearchQueries' }), {
        target: { value: 'users' },
      });

      expect(groupHeaders().map((header) => header.textContent)).toEqual(['alpha2']);
      expect(linkNames()).toEqual(['Daily users', 'weekly users']);
    });

    test('keeps a whole group when the search matches its tag', () => {
      renderPanel({ queries: TAGGED, currentQueryId: 'q_1' });

      fireEvent.change(screen.getByRole('textbox', { name: 'QuerySourcePanel.SearchQueries' }), {
        target: { value: 'ALPHA' },
      });

      expect(groupHeaders().map((header) => header.textContent)).toEqual(['alpha2']);
      expect(linkNames()).toEqual(['Daily users', 'weekly users']);
    });

    test('shows no group header when the search leaves only untagged queries', () => {
      renderPanel({ queries: TAGGED, currentQueryId: 'q_1' });

      fireEvent.change(screen.getByRole('textbox', { name: 'QuerySourcePanel.SearchQueries' }), {
        target: { value: 'aardvark' },
      });

      expect(linkNames()).toEqual(['aardvark']);
      expect(screen.queryByRole('button', { name: 'QuerySourcePanel.QueryTag' })).toBeNull();
    });

    test('drops the groups the scope filter empties', async () => {
      const user = userEvent.setup();
      renderPanel({ queries: TAGGED, currentQueryId: 'q_1' });

      await user.click(screen.getByRole('button', { name: 'QuerySourcePanel.ScopeFilter' }));
      await user.click(await screen.findByRole('menuitemradio', { name: 'Queries.ScopePersonal' }));

      expect(await screen.findByRole('button', { name: 'QuerySourcePanel.ScopeFilterActive' })).toBeInTheDocument();
      expect(groupHeaders().map((header) => header.textContent)).toEqual(['Beta1']);
      expect(linkNames()).toEqual(['Revenue']);
    });
  });

  describe('narrow viewport', () => {
    beforeEach(() => {
      vi.stubGlobal('innerWidth', 800);
    });

    test('starts collapsed and opens over the builder without touching the remembered state', async () => {
      const user = userEvent.setup();
      renderPanel();

      await user.click(await screen.findByRole('button', { name: 'QuerySourcePanel.Expand' }));

      expect(tab('QuerySourcePanel.Tables')).toBeInTheDocument();
      expect(screen.getByText(/^builder/)).toBeInTheDocument();
      expect(localStorage.getItem('query-builder-source-panel-collapsed')).toBeNull();
    });

    test('closes again from its collapse control', async () => {
      const user = userEvent.setup();
      renderPanel();
      await user.click(await screen.findByRole('button', { name: 'QuerySourcePanel.Expand' }));

      await user.click(screen.getByRole('button', { name: 'QuerySourcePanel.Collapse' }));

      expect(screen.queryByRole('tab', { name: 'QuerySourcePanel.Tables' })).toBeNull();
    });
  });

  describe('read failures', () => {
    test('reports a failed table read and a failed query read by notification', () => {
      render(
        <SourcePanelProvider
          tables={[]}
          queries={[]}
          tablesFailure={{ errorHeader: 'Service unavailable', errorMessage: 'upstream timeout', requestId: 'trace-1' }}
          queriesFailure={{}}
        >
          <div>page</div>
        </SourcePanelProvider>,
      );

      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'QueryBuilder.EntitiesLoadFailed', description: 'upstream timeout' }),
      );
      expect(showNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'QuerySourcePanel.QueriesLoadFailed' }),
      );
    });

    test('reports nothing when both reads succeeded', () => {
      renderPanel();

      expect(showNotification).not.toHaveBeenCalled();
    });
  });

  describe('scroll position', () => {
    test('restores the list scroll when the panel remounts on navigation', () => {
      const renderShell = (currentQueryId: string) => (
        <SourcePanelProvider tables={TABLES} queries={QUERIES}>
          <QueryPageShell key={currentQueryId} currentQueryId={currentQueryId}>
            <div>builder</div>
          </QueryPageShell>
        </SourcePanelProvider>
      );
      const { rerender } = render(renderShell('sq_1'));
      const list = screen.getAllByRole('list')[0];
      list.scrollTop = 120;
      fireEvent.scroll(list);

      rerender(renderShell('sq_2'));

      expect(screen.getAllByRole('list')[0]).not.toBe(list);
      expect(screen.getAllByRole('list')[0].scrollTop).toBe(120);
    });
  });

  describe('leaving unsaved work', () => {
    test('navigates directly from a clean page', async () => {
      const user = userEvent.setup();
      renderPanel({ currentTable: 'conversation' });

      await user.click(screen.getByRole('link', { name: 'dial_usage_log' }));

      expect(screen.queryByText('Entities.DiscardChanges')).toBeNull();
    });

    test('asks before leaving and completes the navigation on confirm', async () => {
      const user = userEvent.setup();
      const onDiscard = vi.fn();
      renderPanel({ currentTable: 'conversation', hasUnsavedWork: true, onDiscard });

      await user.click(screen.getByRole('link', { name: 'dial_usage_log' }));
      const dialog = (await screen.findByText('Entities.DiscardChanges')).closest('[role="dialog"]') as HTMLElement;
      expect(mockPush).not.toHaveBeenCalled();
      expect(screen.getByText('builder on the default table')).toBeInTheDocument();

      await user.click(within(dialog).getByRole('button', { name: 'Buttons.Discard' }));

      expect(await screen.findByText('builder on dial_usage_log')).toBeInTheDocument();
      expect(mockPush).toHaveBeenCalledExactlyOnceWith('/en/queries');
      expect(onDiscard).toHaveBeenCalledOnce();
    });

    test('keeps the page when the confirmation is cancelled', async () => {
      const user = userEvent.setup();
      const onDiscard = vi.fn();
      renderPanel({ currentQueryId: 'sq_1', hasUnsavedWork: true, onDiscard });

      await user.click(screen.getByRole('link', { name: 'Cost concentration' }));
      const dialog = (await screen.findByText('Entities.DiscardChanges')).closest('[role="dialog"]') as HTMLElement;
      await user.click(within(dialog).getByRole('button', { name: 'Buttons.ContinueEditing' }));

      expect(mockPush).not.toHaveBeenCalled();
      expect(onDiscard).not.toHaveBeenCalled();
    });

    test('does not intercept a click that opens a new tab', () => {
      renderPanel({ currentTable: 'conversation', hasUnsavedWork: true });

      fireEvent.click(screen.getByRole('link', { name: 'dial_usage_log' }), { metaKey: true });

      expect(screen.queryByText('Entities.DiscardChanges')).toBeNull();
    });
  });
});
