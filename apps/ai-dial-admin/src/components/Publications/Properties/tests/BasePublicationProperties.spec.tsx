import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import BasePublicationProperties from '../Properties';
import { EntitiesI18nKey, EntityFieldsI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';

const basePublication = {
  action: 'ADD',
  author: 'Author',
  createdAt: '2023-01-01T00:00:00Z',
  folderId: 'folder',
  rules: [],
};

describe('BasePublicationProperties', () => {
  it('renders all main fields', () => {
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
    expect(screen.getByText(EntityFieldsI18nKey.createdAt)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.FolderStorage)).toBeInTheDocument();
  });

  it('renders runner if runnerId exists', () => {
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
