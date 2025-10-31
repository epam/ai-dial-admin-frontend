import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import ApplicationInfo from '../ApplicationInfo';
import { EntityFieldsI18nKey } from '@/src/constants/i18n';

describe('ApplicationInfo', () => {
  test('renders all fields from application', () => {
    const application = {
      displayName: 'Test App',
      displayVersion: '1.0.0',
      description: 'A test application',
      descriptionKeywords: ['AI', 'Dial'],
    } as any;

    render(<ApplicationInfo application={application} />);

    expect(screen.getByText(EntityFieldsI18nKey.description)).toBeInTheDocument();
    expect(screen.getByText('A test application')).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.iconUrl)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.topics)).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Dial')).toBeInTheDocument();
  });

  test('renders nothing if application is null', () => {
    const { container } = render(<ApplicationInfo application={null as any} />);
    expect(container.firstChild).toBeNull();
  });
});
