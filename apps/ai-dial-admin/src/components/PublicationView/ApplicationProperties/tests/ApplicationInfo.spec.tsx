import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import ApplicationInfo from '../ApplicationInfo';
import { DialApplicationResource } from '@/src/models/dial/application-resource';
import { CreateI18nKey, EntitiesI18nKey, TopicsI18nKey } from '@/src/constants/i18n';

describe('ApplicationInfo', () => {
  test('renders all fields from application', () => {
    const application = {
      displayName: 'Test App',
      displayVersion: '1.0.0',
      description: 'A test application',
      descriptionKeywords: ['AI', 'Dial'],
    } as DialApplicationResource;

    render(<ApplicationInfo application={application} />);

    expect(screen.getByText(CreateI18nKey.NameTitle)).toBeInTheDocument();
    expect(screen.getByText('Test App')).toBeInTheDocument();
    expect(screen.getByText(CreateI18nKey.VersionTitle)).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText(CreateI18nKey.DescriptionTitle)).toBeInTheDocument();
    expect(screen.getByText('A test application')).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.Icon)).toBeInTheDocument();
    expect(screen.getByText(TopicsI18nKey.Topics)).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Dial')).toBeInTheDocument();
  });

  test('renders nothing if application is null', () => {
    const { container } = render(<ApplicationInfo application={null as any} />);
    expect(container.firstChild).toBeNull();
  });
});
