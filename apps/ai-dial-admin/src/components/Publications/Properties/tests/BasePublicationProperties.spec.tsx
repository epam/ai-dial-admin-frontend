import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import BasePublicationProperties from '../Properties';

const basePublication = {
  action: 'ADD',
  author: 'Author',
  createdAt: '2023-01-01T00:00:00Z',
  folderId: 'folder',
  rules: [],
};

describe('BasePublicationProperties', () => {
  test('renders all main fields', () => {
    render(
      <BasePublicationProperties
        view={ApplicationRoute.Prompts}
        publication={basePublication as any}
        applicationSchemes={[]}
      >
        <div>ChildrenContent</div>
      </BasePublicationProperties>,
    );
    expect(screen.getByText(EntitiesI18nKey.Action)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.Author)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.FolderStorage)).toBeInTheDocument();
  });

  test('renders runner if runnerId exists', () => {
    const publication = {
      ...basePublication,
      applicationResources: [{ applicationTypeSchemaId: 'runner-id' }],
    };
    const applicationSchemes = [{ $id: 'runner-id', 'dial:applicationTypeDisplayName': 'RunnerName' }];
    render(
      <BasePublicationProperties
        view={ApplicationRoute.ApplicationPublications}
        publication={publication as any}
        applicationSchemes={applicationSchemes as any}
      >
        <div>ChildrenContent</div>
      </BasePublicationProperties>,
    );
    expect(screen.getByText(EntitiesI18nKey.Runner)).toBeInTheDocument();
    expect(screen.getByText('RunnerName')).toBeInTheDocument();
  });
});
