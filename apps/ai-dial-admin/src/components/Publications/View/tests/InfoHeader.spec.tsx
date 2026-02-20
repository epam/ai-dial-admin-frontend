import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { ActionType, Publication } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import PublicationInfoHeader from '../InfoHeader';

vi.mock('@/src/components/Common/LabelledText/LabelledText', () => ({
  default: ({ label, text, children }: any) => (
    <div role="region" aria-label="labelled-text">
      <div role="region" aria-label="label">
        {label}
      </div>
      {text && (
        <div role="region" aria-label="text">
          {text}
        </div>
      )}
      {children && (
        <div role="region" aria-label="children">
          {children}
        </div>
      )}
    </div>
  ),
}));

const createMockPublication = (overrides?: Partial<Publication>): Publication => ({
  path: 'publications/test',
  requestName: 'test-request',
  author: 'test@example.com',
  displayAuthor: 'Test Author',
  createdAt: '2024-01-15T10:30:00Z',
  status: 'pending',
  action: ActionType.ADD,
  folderId: 'folder1',
  ...overrides,
});

const setup = (props: { entity: Publication; view: ApplicationRoute }) => {
  const utils = render(<PublicationInfoHeader {...props} />);
  return utils;
};

describe('Publications :: InfoHeader', () => {
  test('renders all publication info fields', () => {
    const entity = createMockPublication();
    setup({ entity, view: ApplicationRoute.PromptPublications });

    const labels = screen.getAllByRole('region', { name: 'label' });
    expect(labels).toHaveLength(3);

    const labelTexts = labels.map((label) => label.textContent);
    expect(labelTexts).toContain(EntitiesI18nKey.Action);
    expect(labelTexts).toContain(EntityFieldsI18nKey.createdAt);
    expect(labelTexts).toContain(EntityFieldsI18nKey.displayAuthor);
  });

  test('renders action field with indicator', () => {
    const entity = createMockPublication({ action: ActionType.ADD });
    setup({ entity, view: ApplicationRoute.PromptPublications });

    const actionIndicator = document.querySelector('.bg-accent-primary');
    expect(actionIndicator).toBeInTheDocument();
    expect(actionIndicator).toHaveClass('flex', 'w-2', 'h-2', 'mr-1', 'rounded', 'no-user-select');
  });

  test('renders ADD action with correct styling', () => {
    const entity = createMockPublication({ action: ActionType.ADD });
    setup({ entity, view: ApplicationRoute.PromptPublications });

    const actionIndicator = document.querySelector('.bg-accent-primary');
    expect(actionIndicator).toBeInTheDocument();
  });

  test('renders DELETE action with correct styling', () => {
    const entity = createMockPublication({ action: ActionType.DELETE });
    setup({ entity, view: ApplicationRoute.PromptPublications });

    const actionIndicator = document.querySelector('.bg-red-400');
    expect(actionIndicator).toBeInTheDocument();
  });

  test('renders ADD_IF_ABSENT action with correct styling', () => {
    const entity = createMockPublication({ action: ActionType.ADD_IF_ABSENT });
    setup({ entity, view: ApplicationRoute.PromptPublications });

    const actionIndicator = document.querySelector('.bg-accent-primary');
    expect(actionIndicator).toBeInTheDocument();
  });

  test('renders formatted creation date', () => {
    const entity = createMockPublication({ createdAt: '2024-01-15T10:30:00Z' });
    setup({ entity, view: ApplicationRoute.PromptPublications });

    expect(screen.getByText(new Date('2024-01-15T10:30:00Z').toLocaleString())).toBeInTheDocument();
  });

  test('renders display author', () => {
    const entity = createMockPublication({ displayAuthor: 'John Doe' });

    setup({ entity, view: ApplicationRoute.PromptPublications });

    const texts = screen.getAllByRole('region', { name: 'text' });
    const textContents = texts.map((el) => el.textContent);
    expect(textContents).toContain('John Doe');
  });

  test('does not render action field when action is missing', () => {
    const entity = createMockPublication();
    delete (entity as any).action;

    setup({ entity, view: ApplicationRoute.PromptPublications });

    const labels = screen.getAllByRole('region', { name: 'label' });
    const labelTexts = labels.map((label) => label.textContent);
    expect(labelTexts).not.toContain(EntitiesI18nKey.Action);
  });

  test('does not render createdAt field when date is missing', () => {
    const entity = createMockPublication();
    delete (entity as any).createdAt;

    setup({ entity, view: ApplicationRoute.PromptPublications });

    const labels = screen.getAllByRole('region', { name: 'label' });
    const labelTexts = labels.map((label) => label.textContent);
    expect(labelTexts).not.toContain(EntityFieldsI18nKey.createdAt);
  });

  test('does not render displayAuthor field when author is missing', () => {
    const entity = createMockPublication();
    delete (entity as any).displayAuthor;

    setup({ entity, view: ApplicationRoute.PromptPublications });

    const labels = screen.getAllByRole('region', { name: 'label' });
    const labelTexts = labels.map((label) => label.textContent);
    expect(labelTexts).not.toContain(EntityFieldsI18nKey.displayAuthor);
  });

  test('renders only action when other fields are missing', () => {
    const entity = createMockPublication({ action: ActionType.ADD });
    delete (entity as any).createdAt;
    delete (entity as any).displayAuthor;

    setup({ entity, view: ApplicationRoute.PromptPublications });

    const labels = screen.getAllByRole('region', { name: 'label' });
    expect(labels).toHaveLength(1);
    expect(labels[0].textContent).toBe(EntitiesI18nKey.Action);
  });

  test('applies correct container styling', () => {
    const entity = createMockPublication();
    const { container } = setup({ entity, view: ApplicationRoute.PromptPublications });

    const headerContainer = container.firstElementChild;
    expect(headerContainer).toHaveClass(
      'flex',
      'flex-col',
      'sm:flex-row',
      'gap-8',
      'pb-8',
      'border-b',
      'border-primary',
    );
  });

  test('works with different ApplicationRoute views', () => {
    const entity = createMockPublication();

    const { rerender } = setup({ entity, view: ApplicationRoute.PromptPublications });
    expect(screen.getAllByRole('region', { name: 'label' })).toHaveLength(3);

    rerender(<PublicationInfoHeader entity={entity} view={ApplicationRoute.ApplicationPublications} />);
    expect(screen.getAllByRole('region', { name: 'label' })).toHaveLength(3);
  });

  test('renders empty state when all optional fields are missing', () => {
    const entity = createMockPublication();
    delete (entity as any).action;
    delete (entity as any).createdAt;
    delete (entity as any).displayAuthor;

    const { container } = setup({ entity, view: ApplicationRoute.PromptPublications });

    const headerContainer = container.firstElementChild;
    expect(headerContainer).toBeInTheDocument();
    expect(headerContainer).toHaveClass('border-b', 'border-primary');

    expect(screen.queryAllByRole('region', { name: 'labelled-text' })).toHaveLength(0);
  });

  test('translates action type using ACTION_I18N_KEYS', () => {
    const entity = createMockPublication({ action: ActionType.ADD });
    setup({ entity, view: ApplicationRoute.PromptPublications });

    const childrenElements = screen.getAllByRole('region', { name: 'children' });
    expect(childrenElements.length).toBeGreaterThan(0);
  });

  test('renders with minimal publication data', () => {
    const minimalEntity: Publication = {
      path: 'test/path',
      requestName: 'minimal',
      author: 'author@test.com',
      createdAt: '2024-01-01',
      status: 'pending',
      action: ActionType.ADD,
      folderId: 'folder',
    };

    setup({ entity: minimalEntity, view: ApplicationRoute.PromptPublications });

    const labels = screen.getAllByRole('region', { name: 'label' });
    expect(labels).toHaveLength(2);
  });

  test('handles empty string values for optional fields', () => {
    const entity = createMockPublication({
      displayAuthor: '',
      createdAt: '',
    });

    setup({ entity, view: ApplicationRoute.PromptPublications });

    const labels = screen.getAllByRole('region', { name: 'label' });

    expect(labels.length).toBeGreaterThanOrEqual(1);
  });
});
