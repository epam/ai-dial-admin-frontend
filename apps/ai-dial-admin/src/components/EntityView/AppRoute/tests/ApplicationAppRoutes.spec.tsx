import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import ApplicationAppRoutes from '@/src/components/EntityView/AppRoute/ApplicationAppRoutes';
import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { DialApplication, DialApplicationScheme } from '@/src/models/dial/application';
import { DialAppRoute } from '@/src/models/dial/route';
import { ApplicationRoute } from '@/src/types/routes';

let capturedRoutesProps: { routes?: DialAppRoute[]; disabled?: boolean } | null = null;

vi.mock('@/src/components/EntityView/AppRoute/AppRoute', () => ({
  default: (props: { routes?: DialAppRoute[]; disabled?: boolean }) => {
    capturedRoutesProps = props;
    return (
      <ul aria-label="routes">
        {props.routes?.map((route) => (
          <li key={route.name}>{route.name}</li>
        ))}
      </ul>
    );
  },
}));

const entityRunner = {
  $id: 'urn:runner:entity',
  'dial:applicationTypeRoutes': [{ name: 'entity-route' }],
} as DialApplicationScheme;

const renderRoutes = (entity: DialApplication) =>
  render(
    <ApplicationAppRoutes
      view={ApplicationRoute.Applications}
      applicationRunners={[entityRunner]}
      selectedEntity={entity}
      onChangeEntity={vi.fn()}
    />,
  );

describe('ApplicationAppRoutes', () => {
  test('renders an entity application route array unchanged', () => {
    renderRoutes({ name: 'app', routes: [{ name: 'application-route' }] } as DialApplication);

    expect(screen.getByText('application-route')).toBeDefined();
    expect(capturedRoutesProps?.disabled).toBe(false);
  });

  test('renders the selected admin-backend runner route array read-only', () => {
    renderRoutes({
      name: 'app',
      source: { $type: SOURCE_TYPE.SCHEMA, applicationTypeSchemaId: 'urn:runner:entity' },
    } as DialApplication);

    expect(screen.getByText('entity-route')).toBeDefined();
    expect(capturedRoutesProps?.disabled).toBe(true);
  });
});
